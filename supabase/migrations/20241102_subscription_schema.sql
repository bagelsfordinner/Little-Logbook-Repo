-- =====================================================
-- Little Logbook Subscription Schema
-- Simple implementation for single-tier subscription
-- =====================================================

-- User subscriptions table (simplified)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Subscription status
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'canceled', 'expired', 'lifetime')),
  
  -- Stripe integration
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  
  -- Trial and billing periods
  trial_starts_at timestamptz DEFAULT now(),
  trial_ends_at timestamptz DEFAULT (now() + interval '7 days'),
  current_period_start timestamptz,
  current_period_end timestamptz,
  
  -- Coupon system
  coupon_code text,
  coupon_applied_at timestamptz,
  
  -- Cancellation
  canceled_at timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Coupon codes table
CREATE TABLE IF NOT EXISTS coupon_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  
  -- Coupon configuration
  type text NOT NULL CHECK (type IN ('lifetime_free', 'trial_extension', 'discount')),
  discount_percent integer DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  trial_extension_days integer DEFAULT 0,
  
  -- Usage limits
  max_uses integer DEFAULT 1,
  used_count integer DEFAULT 0 CHECK (used_count >= 0),
  
  -- Validity
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  
  -- Metadata
  description text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Usage tracking (simplified for current single-logbook model)
CREATE TABLE IF NOT EXISTS user_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Current usage stats
  logbooks_count integer DEFAULT 0,
  storage_used_bytes bigint DEFAULT 0,
  total_members_count integer DEFAULT 0,
  current_month_uploads integer DEFAULT 0,
  
  -- Reset tracking
  last_reset_at timestamptz DEFAULT now(),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Simple billing history
CREATE TABLE IF NOT EXISTS billing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Stripe data
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  
  -- Payment details
  amount_cents integer NOT NULL,
  currency text DEFAULT 'usd',
  status text NOT NULL CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
  
  -- Period covered
  period_start timestamptz,
  period_end timestamptz,
  
  -- Metadata
  description text,
  invoice_url text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- Indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_code ON coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_active ON coupon_codes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON billing_history(user_id);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- User subscriptions: Users can only see their own
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON user_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can manage all subscriptions
CREATE POLICY "Service role can manage subscriptions"
  ON user_subscriptions FOR ALL
  TO service_role
  USING (true);

-- Coupon codes: Public read for validation, service role for management
CREATE POLICY "Anyone can read active coupons"
  ON coupon_codes FOR SELECT
  TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Service role can manage coupons"
  ON coupon_codes FOR ALL
  TO service_role
  USING (true);

-- User usage: Users can only see their own
CREATE POLICY "Users can view own usage"
  ON user_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage"
  ON user_usage FOR ALL
  TO service_role
  USING (true);

-- Billing history: Users can only see their own
CREATE POLICY "Users can view own billing history"
  ON billing_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage billing history"
  ON billing_history FOR ALL
  TO service_role
  USING (true);

-- =====================================================
-- Functions for subscription management
-- =====================================================

-- Function to get user's current subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(check_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record user_subscriptions%ROWTYPE;
  coupon_record coupon_codes%ROWTYPE;
  result jsonb;
BEGIN
  -- Get user's subscription
  SELECT * INTO subscription_record
  FROM user_subscriptions
  WHERE user_id = check_user_id;
  
  -- If no subscription exists, create a trial
  IF subscription_record IS NULL THEN
    INSERT INTO user_subscriptions (user_id, status)
    VALUES (check_user_id, 'trial')
    RETURNING * INTO subscription_record;
    
    -- Also create usage record
    INSERT INTO user_usage (user_id)
    VALUES (check_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  -- Check if coupon provides lifetime access
  IF subscription_record.coupon_code IS NOT NULL THEN
    SELECT * INTO coupon_record
    FROM coupon_codes
    WHERE code = subscription_record.coupon_code
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now());
    
    IF coupon_record.type = 'lifetime_free' THEN
      result := jsonb_build_object(
        'has_access', true,
        'access_type', 'lifetime',
        'subscription', row_to_json(subscription_record),
        'coupon', row_to_json(coupon_record)
      );
      RETURN result;
    END IF;
  END IF;
  
  -- Check trial period
  IF subscription_record.status = 'trial' AND subscription_record.trial_ends_at > now() THEN
    result := jsonb_build_object(
      'has_access', true,
      'access_type', 'trial',
      'days_remaining', EXTRACT(epoch FROM (subscription_record.trial_ends_at - now())) / 86400,
      'subscription', row_to_json(subscription_record)
    );
    RETURN result;
  END IF;
  
  -- Check active subscription
  IF subscription_record.status = 'active' AND 
     (subscription_record.current_period_end IS NULL OR subscription_record.current_period_end > now()) THEN
    result := jsonb_build_object(
      'has_access', true,
      'access_type', 'paid',
      'subscription', row_to_json(subscription_record)
    );
    RETURN result;
  END IF;
  
  -- No access
  result := jsonb_build_object(
    'has_access', false,
    'access_type', 'expired',
    'subscription', row_to_json(subscription_record)
  );
  RETURN result;
END;
$$;

-- Function to apply coupon code
CREATE OR REPLACE FUNCTION apply_coupon_code(check_user_id uuid, coupon_code_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  coupon_record coupon_codes%ROWTYPE;
  subscription_record user_subscriptions%ROWTYPE;
  result jsonb;
BEGIN
  -- Get coupon
  SELECT * INTO coupon_record
  FROM coupon_codes
  WHERE code = coupon_code_input
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND used_count < max_uses;
  
  IF coupon_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired coupon code');
  END IF;
  
  -- Get or create user subscription
  SELECT * INTO subscription_record
  FROM user_subscriptions
  WHERE user_id = check_user_id;
  
  IF subscription_record IS NULL THEN
    INSERT INTO user_subscriptions (user_id, status, coupon_code, coupon_applied_at)
    VALUES (check_user_id, 'trial', coupon_code_input, now())
    RETURNING * INTO subscription_record;
  ELSE
    UPDATE user_subscriptions
    SET coupon_code = coupon_code_input,
        coupon_applied_at = now(),
        updated_at = now()
    WHERE id = subscription_record.id
    RETURNING * INTO subscription_record;
  END IF;
  
  -- Update coupon usage
  UPDATE coupon_codes
  SET used_count = used_count + 1,
      updated_at = now()
  WHERE id = coupon_record.id;
  
  -- Apply coupon effects
  CASE coupon_record.type
    WHEN 'lifetime_free' THEN
      UPDATE user_subscriptions
      SET status = 'lifetime'
      WHERE id = subscription_record.id;
      
    WHEN 'trial_extension' THEN
      UPDATE user_subscriptions
      SET trial_ends_at = trial_ends_at + (coupon_record.trial_extension_days || ' days')::interval
      WHERE id = subscription_record.id;
  END CASE;
  
  RETURN jsonb_build_object(
    'success', true,
    'coupon_type', coupon_record.type,
    'message', 'Coupon applied successfully'
  );
END;
$$;

-- =====================================================
-- Trigger for updated_at timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupon_codes_updated_at
  BEFORE UPDATE ON coupon_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_usage_updated_at
  BEFORE UPDATE ON user_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Insert initial coupon codes
-- =====================================================

INSERT INTO coupon_codes (code, type, description, max_uses) VALUES
('FOUNDER', 'lifetime_free', 'Founder lifetime access', 1),
('DEMO_USER', 'lifetime_free', 'Demo user access', 10),
('BETA_TESTER', 'lifetime_free', 'Beta tester access', 25),
('TRIAL_30', 'trial_extension', 'Extend trial by 30 days', 100, 30)
ON CONFLICT (code) DO NOTHING;
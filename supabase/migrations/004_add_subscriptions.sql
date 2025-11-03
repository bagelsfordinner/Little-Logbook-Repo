-- Subscription System Migration
-- Adds subscription tiers, billing, and usage tracking

-- =====================================================
-- SUBSCRIPTION TABLES
-- =====================================================

-- 1. Subscription Plans table (predefined plans)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY, -- 'free', 'family', 'legacy'
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    price_monthly_cents INTEGER NOT NULL DEFAULT 0,
    price_yearly_cents INTEGER NOT NULL DEFAULT 0,
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    features JSONB NOT NULL DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id) -- One subscription per user
);

-- 3. Usage Tracking table
CREATE TABLE IF NOT EXISTS user_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    logbooks_count INTEGER NOT NULL DEFAULT 0,
    storage_used_bytes BIGINT NOT NULL DEFAULT 0,
    total_members_count INTEGER NOT NULL DEFAULT 0,
    current_month_uploads INTEGER NOT NULL DEFAULT 0,
    last_reset_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. Billing History table
CREATE TABLE IF NOT EXISTS billing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
    description TEXT,
    invoice_url TEXT,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INSERT DEFAULT SUBSCRIPTION PLANS
-- =====================================================

INSERT INTO subscription_plans (id, name, display_name, description, price_monthly_cents, price_yearly_cents, features, limits, sort_order) VALUES
('free', 'free', 'Free', 'Perfect for getting started with your first family logbook', 0, 0, 
 '{"basic_themes": true, "community_support": true, "mobile_app": true}',
 '{"logbooks": 1, "storage_gb": 0.1, "members_per_logbook": 5, "monthly_uploads": 50}', 1),

('family', 'family', 'Family Plan', 'Great for growing families with multiple children', 999, 9990,
 '{"all_themes": true, "custom_themes": true, "priority_support": true, "advanced_media_tools": true, "bulk_download": true}',
 '{"logbooks": 3, "storage_gb": 5, "members_per_logbook": 15, "monthly_uploads": 500}', 2),

('legacy', 'legacy', 'Legacy Plan', 'Unlimited everything for large families and memory keepers', 1999, 19990,
 '{"all_features": true, "unlimited_everything": true, "premium_support": true, "pdf_export": true, "print_integration": true, "analytics": true}',
 '{"logbooks": -1, "storage_gb": 25, "members_per_logbook": -1, "monthly_uploads": -1}', 3);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON billing_history(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_stripe_invoice_id ON billing_history(stripe_invoice_id);

-- =====================================================
-- HELPER FUNCTIONS FOR SUBSCRIPTIONS
-- =====================================================

-- Get user's current subscription plan
CREATE OR REPLACE FUNCTION get_user_plan(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    plan_id TEXT;
BEGIN
    SELECT us.plan_id INTO plan_id
    FROM user_subscriptions us
    WHERE us.user_id = get_user_plan.user_id
    AND us.status = 'active'
    AND (us.current_period_end IS NULL OR us.current_period_end > NOW());
    
    -- Default to free plan if no active subscription
    RETURN COALESCE(plan_id, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has access to feature
CREATE OR REPLACE FUNCTION user_has_feature(user_id UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    plan_id TEXT;
    features JSONB;
BEGIN
    plan_id := get_user_plan(user_id);
    
    SELECT sp.features INTO features
    FROM subscription_plans sp
    WHERE sp.id = plan_id;
    
    RETURN (features->feature_name)::BOOLEAN = true OR (features->>'all_features')::BOOLEAN = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's plan limit for a specific resource
CREATE OR REPLACE FUNCTION get_user_limit(user_id UUID, limit_name TEXT)
RETURNS INTEGER AS $$
DECLARE
    plan_id TEXT;
    limit_value INTEGER;
BEGIN
    plan_id := get_user_plan(user_id);
    
    SELECT (sp.limits->>limit_name)::INTEGER INTO limit_value
    FROM subscription_plans sp
    WHERE sp.id = plan_id;
    
    RETURN COALESCE(limit_value, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is within their limits
CREATE OR REPLACE FUNCTION user_within_limit(user_id UUID, limit_name TEXT, current_usage INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    user_limit INTEGER;
BEGIN
    user_limit := get_user_limit(user_id, limit_name);
    
    -- -1 means unlimited
    IF user_limit = -1 THEN
        RETURN true;
    END IF;
    
    RETURN current_usage < user_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user usage stats
CREATE OR REPLACE FUNCTION update_user_usage_stats(user_id UUID)
RETURNS VOID AS $$
DECLARE
    logbook_count INTEGER;
    storage_bytes BIGINT;
    member_count INTEGER;
BEGIN
    -- Count logbooks where user is the creator (parent)
    SELECT COUNT(*) INTO logbook_count
    FROM logbooks l
    WHERE l.created_by = user_id;
    
    -- Calculate total storage used (estimate from media table)
    SELECT COALESCE(SUM(
        CASE 
            WHEN m.media_type = 'image' THEN 2097152 -- 2MB average for images
            WHEN m.media_type = 'video' THEN 10485760 -- 10MB average for videos
            ELSE 1048576 -- 1MB default
        END
    ), 0) INTO storage_bytes
    FROM media m
    JOIN logbooks l ON m.logbook_id = l.id
    WHERE l.created_by = user_id;
    
    -- Count total members across all user's logbooks
    SELECT COALESCE(SUM(member_counts.count), 0) INTO member_count
    FROM (
        SELECT COUNT(*) as count
        FROM logbook_members lm
        JOIN logbooks l ON lm.logbook_id = l.id
        WHERE l.created_by = user_id
        GROUP BY l.id
    ) member_counts;
    
    -- Upsert usage record
    INSERT INTO user_usage (user_id, logbooks_count, storage_used_bytes, total_members_count)
    VALUES (user_id, logbook_count, storage_bytes, member_count)
    ON CONFLICT (user_id)
    DO UPDATE SET
        logbooks_count = EXCLUDED.logbooks_count,
        storage_used_bytes = EXCLUDED.storage_used_bytes,
        total_members_count = EXCLUDED.total_members_count,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS FOR USAGE TRACKING
-- =====================================================

-- Trigger to update usage when logbooks change
CREATE OR REPLACE FUNCTION trigger_update_usage_on_logbook_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM update_user_usage_stats(NEW.created_by);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM update_user_usage_stats(NEW.created_by);
        IF OLD.created_by != NEW.created_by THEN
            PERFORM update_user_usage_stats(OLD.created_by);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_user_usage_stats(OLD.created_by);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER logbook_usage_tracking
    AFTER INSERT OR UPDATE OR DELETE ON logbooks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_usage_on_logbook_change();

-- Trigger to update usage when media changes
CREATE OR REPLACE FUNCTION trigger_update_usage_on_media_change()
RETURNS TRIGGER AS $$
DECLARE
    logbook_owner UUID;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT created_by INTO logbook_owner FROM logbooks WHERE id = NEW.logbook_id;
        PERFORM update_user_usage_stats(logbook_owner);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        SELECT created_by INTO logbook_owner FROM logbooks WHERE id = OLD.logbook_id;
        PERFORM update_user_usage_stats(logbook_owner);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_usage_tracking
    AFTER INSERT OR DELETE ON media
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_usage_on_media_change();

-- =====================================================
-- ROW LEVEL SECURITY FOR SUBSCRIPTION TABLES
-- =====================================================

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- Subscription plans are readable by everyone (for pricing page)
CREATE POLICY "Everyone can read subscription plans" ON subscription_plans
    FOR SELECT USING (is_active = true);

-- Users can only see their own subscription
CREATE POLICY "Users can read own subscription" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own usage
CREATE POLICY "Users can read own usage" ON user_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own billing history
CREATE POLICY "Users can read own billing history" ON billing_history
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_usage_updated_at BEFORE UPDATE ON user_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE FUNCTION public.handle_new_user_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.invite_codes (user_id, code, is_active)
  VALUES (NEW.id, 'SC' || substring(upper(NEW.id::text), 1, 8), true)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created_invite_code ON auth.users;
CREATE TRIGGER on_auth_user_created_invite_code
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_invite_code();

CREATE OR REPLACE FUNCTION public.handle_new_user_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.socra_points (user_id, balance, total_earned, level)
  VALUES (NEW.id, 0, 0, 1)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created_points ON auth.users;
CREATE TRIGGER on_auth_user_created_points
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_points();

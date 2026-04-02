CREATE OR REPLACE FUNCTION public.init_user_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.socra_points (user_id, balance, total_earned, level, level_name)
  VALUES (NEW.id, 0, 0, 1, '学习新手')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.socra_points (user_id, balance, total_earned, level)
  VALUES (NEW.id, 0, 0, 1)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_user_created_init_points ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_points ON auth.users;

CREATE TRIGGER on_auth_user_created_points
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_points();

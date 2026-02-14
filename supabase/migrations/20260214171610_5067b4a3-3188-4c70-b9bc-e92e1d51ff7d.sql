
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'operador',
  unit TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Vehicles
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate TEXT NOT NULL UNIQUE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  current_km INTEGER NOT NULL DEFAULT 0,
  health_score INTEGER NOT NULL DEFAULT 100,
  cost_month NUMERIC NOT NULL DEFAULT 0,
  fuel_avg NUMERIC NOT NULL DEFAULT 0,
  last_maintenance TEXT,
  next_maintenance TEXT,
  driver TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete vehicles" ON public.vehicles FOR DELETE TO authenticated USING (true);

-- Work Orders (Maintenance)
CREATE TABLE public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  plate TEXT NOT NULL,
  vehicle_label TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'preventive',
  status TEXT NOT NULL DEFAULT 'open',
  opened_at DATE NOT NULL DEFAULT CURRENT_DATE,
  closed_at DATE,
  supplier TEXT NOT NULL DEFAULT '',
  cost_total NUMERIC NOT NULL DEFAULT 0,
  km_at_service INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'low',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD work_orders" ON public.work_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Fuel Logs
CREATE TABLE public.fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate TEXT NOT NULL,
  vehicle_label TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  fuel_type TEXT NOT NULL DEFAULT 'diesel',
  liters NUMERIC NOT NULL DEFAULT 0,
  cost_per_liter NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  odometer INTEGER NOT NULL DEFAULT 0,
  station TEXT NOT NULL DEFAULT '',
  driver TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD fuel_logs" ON public.fuel_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tires
CREATE TABLE public.tires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate TEXT NOT NULL,
  position TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  size TEXT NOT NULL DEFAULT '',
  installed_at DATE,
  installed_km INTEGER NOT NULL DEFAULT 0,
  current_km INTEGER NOT NULL DEFAULT 0,
  life_expected_km INTEGER NOT NULL DEFAULT 50000,
  depth_mm NUMERIC NOT NULL DEFAULT 8,
  status TEXT NOT NULL DEFAULT 'good',
  cost_unit NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD tires" ON public.tires FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Fines
CREATE TABLE public.fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  plate TEXT NOT NULL,
  vehicle_label TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  driver_name TEXT NOT NULL DEFAULT '',
  infraction TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  location TEXT NOT NULL DEFAULT '',
  points INTEGER NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC,
  auto_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD fines" ON public.fines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Vehicle Documents
CREATE TABLE public.vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  plate TEXT NOT NULL,
  vehicle_label TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  doc_type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'valid',
  responsible TEXT NOT NULL DEFAULT '',
  cost NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD vehicle_documents" ON public.vehicle_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Incidents
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  plate TEXT NOT NULL,
  vehicle_label TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  driver_name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'accident',
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TEXT NOT NULL DEFAULT '00:00',
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  damage_estimate NUMERIC NOT NULL DEFAULT 0,
  has_injury BOOLEAN NOT NULL DEFAULT false,
  police_report TEXT,
  insurance_claim TEXT,
  resolved_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can CRUD incidents" ON public.incidents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

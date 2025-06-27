-- Staff tablosu - Her provider'da çalışan kişileri tutar
CREATE TABLE public.staff (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  provider_id uuid NOT NULL,
  user_id uuid,
  first_name character varying(100) NOT NULL,
  last_name character varying(100) NOT NULL,
  "position" character varying(100) NOT NULL, -- Kuaför, Masör, Estetisyen vs.
  specialization character varying(200), -- Uzmanlık alanları
  experience_years integer DEFAULT 0,
  phone character varying(20),
  email character varying(255),
  bio text, -- Kişisel açıklama
  photo_url character varying(500), -- Profil fotoğrafı
  rating numeric(3,2) DEFAULT 0.0, -- Puan (0.00 - 5.00)
  total_reviews integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_available boolean DEFAULT true, -- Şu anda müsait mi?
  working_hours jsonb, -- Çalışma saatleri JSON formatında
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT staff_pkey PRIMARY KEY (id),
  CONSTRAINT staff_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE,
  CONSTRAINT staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Staff-Services ilişki tablosu - Hangi staff üyesinin hangi hizmetleri sunduğunu belirtir
CREATE TABLE public.staff_services (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  staff_id uuid NOT NULL,
  service_id uuid NOT NULL,
  is_primary boolean DEFAULT false, -- Bu hizmet staff'ın ana uzmanlığı mı?
  experience_level character varying(50) DEFAULT 'intermediate', -- beginner, intermediate, expert
  price_modifier numeric(3,2) DEFAULT 1.0, -- Fiyat çarpanı (1.0 = normal fiyat, 1.2 = %20 daha pahalı)
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT staff_services_pkey PRIMARY KEY (id),
  CONSTRAINT staff_services_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE,
  CONSTRAINT staff_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE,
  CONSTRAINT staff_services_unique UNIQUE (staff_id, service_id)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_staff_provider_id ON public.staff USING btree (provider_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON public.staff USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_staff_active ON public.staff USING btree (is_active, is_available);
CREATE INDEX IF NOT EXISTS idx_staff_position ON public.staff USING btree ("position");

-- Staff-Services index'leri
CREATE INDEX IF NOT EXISTS idx_staff_services_staff_id ON public.staff_services USING btree (staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_services_service_id ON public.staff_services USING btree (service_id);
CREATE INDEX IF NOT EXISTS idx_staff_services_active ON public.staff_services USING btree (is_active);

-- Updated at trigger'ları
CREATE TRIGGER update_staff_updated_at 
  BEFORE UPDATE ON staff 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_services_updated_at 
  BEFORE UPDATE ON staff_services 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Örnek staff verileri
INSERT INTO public.staff (
  provider_id,
  first_name,
  last_name,
  "position",
  specialization,
  experience_years,
  phone,
  email,
  bio,
  rating,
  total_reviews,
  is_active,
  is_available
) VALUES (
  '48380d3f-154d-43be-a6fe-8439ce766e4f', -- Güzellik Salonu provider ID
  'Fatma',
  'Demir',
  'Kuaför',
  'Saç kesimi, boyama, şekillendirme',
  8,
  '+90 555 111 2233',
  'fatma@guzelliksalonu.com',
  '8 yıllık deneyimimle modern saç stilleri konusunda uzmanım. Müşteri memnuniyeti benim için en önemli öncelik.',
  4.8,
  156,
  true,
  true
);

INSERT INTO public.staff (
  provider_id,
  first_name,
  last_name,
  "position",
  specialization,
  experience_years,
  phone,
  email,
  bio,
  rating,
  total_reviews,
  is_active,
  is_available
) VALUES (
  '48380d3f-154d-43be-a6fe-8439ce766e4f', -- Güzellik Salonu provider ID
  'Ayşe',
  'Kaya',
  'Estetisyen',
  'Cilt bakımı, makyaj, epilasyon',
  5,
  '+90 555 222 3344',
  'ayse@guzelliksalonu.com',
  'Cilt sağlığı ve güzellik konusunda uzmanım. Her müşterinin ihtiyacına özel çözümler sunuyorum.',
  4.6,
  89,
  true,
  true
);

INSERT INTO public.staff (
  provider_id,
  first_name,
  last_name,
  "position",
  specialization,
  experience_years,
  phone,
  email,
  bio,
  rating,
  total_reviews,
  is_active,
  is_available
) VALUES (
  '48380d3f-154d-43be-a6fe-8439ce766e4f', -- Güzellik Salonu provider ID
  'Mehmet',
  'Yılmaz',
  'Masör',
  'Terapötik masaj, rahatlatıcı masaj',
  6,
  '+90 555 333 4455',
  'mehmet@guzelliksalonu.com',
  'Profesyonel masaj teknikleri ile stres ve yorgunluğunuzu atın. Vücut sağlığınız için özel programlar.',
  4.9,
  203,
  true,
  true
);

-- Staff-Services ilişkileri
-- Fatma Demir (Kuaför) - Saç hizmetleri
INSERT INTO public.staff_services (
  staff_id,
  service_id,
  is_primary,
  experience_level,
  price_modifier
) VALUES (
  (SELECT id FROM public.staff WHERE first_name = 'Fatma' AND last_name = 'Demir' LIMIT 1),
  (SELECT id FROM public.services WHERE name = 'Saç Kesimi' LIMIT 1),
  true,
  'expert',
  1.0
);

INSERT INTO public.staff_services (
  staff_id,
  service_id,
  is_primary,
  experience_level,
  price_modifier
) VALUES (
  (SELECT id FROM public.staff WHERE first_name = 'Fatma' AND last_name = 'Demir' LIMIT 1),
  (SELECT id FROM public.services WHERE name = 'Saç Boyama' LIMIT 1),
  true,
  'expert',
  1.1
);

INSERT INTO public.staff_services (
  staff_id,
  service_id,
  is_primary,
  experience_level,
  price_modifier
) VALUES (
  (SELECT id FROM public.staff WHERE first_name = 'Fatma' AND last_name = 'Demir' LIMIT 1),
  (SELECT id FROM public.services WHERE name = 'Saç Şekillendirme' LIMIT 1),
  false,
  'intermediate',
  1.0
);

-- Ayşe Kaya (Estetisyen) - Cilt bakımı hizmetleri
INSERT INTO public.staff_services (
  staff_id,
  service_id,
  is_primary,
  experience_level,
  price_modifier
) VALUES (
  (SELECT id FROM public.staff WHERE first_name = 'Ayşe' AND last_name = 'Kaya' LIMIT 1),
  (SELECT id FROM public.services WHERE name = 'Cilt Bakımı' LIMIT 1),
  true,
  'expert',
  1.0
);

INSERT INTO public.staff_services (
  staff_id,
  service_id,
  is_primary,
  experience_level,
  price_modifier
) VALUES (
  (SELECT id FROM public.staff WHERE first_name = 'Ayşe' AND last_name = 'Kaya' LIMIT 1),
  (SELECT id FROM public.services WHERE name = 'Makyaj' LIMIT 1),
  true,
  'expert',
  1.2
);

INSERT INTO public.staff_services (
  staff_id,
  service_id,
  is_primary,
  experience_level,
  price_modifier
) VALUES (
  (SELECT id FROM public.staff WHERE first_name = 'Ayşe' AND last_name = 'Kaya' LIMIT 1),
  (SELECT id FROM public.services WHERE name = 'Epilasyon' LIMIT 1),
  false,
  'intermediate',
  1.0
);

-- Mehmet Yılmaz (Masör) - Masaj hizmetleri
INSERT INTO public.staff_services (
  staff_id,
  service_id,
  is_primary,
  experience_level,
  price_modifier
) VALUES (
  (SELECT id FROM public.staff WHERE first_name = 'Mehmet' AND last_name = 'Yılmaz' LIMIT 1),
  (SELECT id FROM public.services WHERE name = 'Terapötik Masaj' LIMIT 1),
  true,
  'expert',
  1.0
);

INSERT INTO public.staff_services (
  staff_id,
  service_id,
  is_primary,
  experience_level,
  price_modifier
) VALUES (
  (SELECT id FROM public.staff WHERE first_name = 'Mehmet' AND last_name = 'Yılmaz' LIMIT 1),
  (SELECT id FROM public.services WHERE name = 'Rahatlatıcı Masaj' LIMIT 1),
  true,
  'expert',
  1.1
);

-- View: Staff ile birlikte sundukları hizmetleri gösteren view
CREATE OR REPLACE VIEW public.staff_with_services AS
SELECT 
  s.id as staff_id,
  s.first_name,
  s.last_name,
  s."position",
  s.specialization,
  s.experience_years,
  s.phone,
  s.email,
  s.bio,
  s.rating,
  s.total_reviews,
  s.is_active,
  s.is_available,
  s.provider_id,
  p.business_name as provider_name,
  array_agg(
    json_build_object(
      'service_id', svc.id,
      'service_name', svc.name,
      'service_description', svc.description,
      'service_price', svc.price,
      'service_duration', svc.duration,
      'is_primary', ss.is_primary,
      'experience_level', ss.experience_level,
      'price_modifier', ss.price_modifier,
      'staff_service_price', svc.price * ss.price_modifier
    )
  ) as services
FROM public.staff s
LEFT JOIN public.providers p ON s.provider_id = p.id
LEFT JOIN public.staff_services ss ON s.id = ss.staff_id
LEFT JOIN public.services svc ON ss.service_id = svc.id
WHERE s.is_active = true AND (ss.is_active = true OR ss.is_active IS NULL)
GROUP BY s.id, s.first_name, s.last_name, s."position", s.specialization, s.experience_years, 
         s.phone, s.email, s.bio, s.rating, s.total_reviews, s.is_active, s.is_available, 
         s.provider_id, p.business_name;

-- Function: Belirli bir hizmeti sunan staff üyelerini getir
CREATE OR REPLACE FUNCTION get_staff_by_service(service_name_param text)
RETURNS TABLE (
  staff_id uuid,
  first_name text,
  last_name text,
  "position" text,
  rating numeric,
  experience_level text,
  price_modifier numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.first_name,
    s.last_name,
    s."position",
    s.rating,
    ss.experience_level,
    ss.price_modifier
  FROM public.staff s
  INNER JOIN public.staff_services ss ON s.id = ss.staff_id
  INNER JOIN public.services svc ON ss.service_id = svc.id
  WHERE svc.name ILIKE '%' || service_name_param || '%'
    AND s.is_active = true 
    AND ss.is_active = true
  ORDER BY s.rating DESC, ss.is_primary DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Staff üyesinin sunduğu hizmetleri getir
CREATE OR REPLACE FUNCTION get_services_by_staff(staff_id_param uuid)
RETURNS TABLE (
  service_id uuid,
  service_name text,
  service_description text,
  service_price numeric,
  service_duration integer,
  is_primary boolean,
  experience_level text,
  price_modifier numeric,
  staff_service_price numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    svc.id,
    svc.name,
    svc.description,
    svc.price,
    svc.duration,
    ss.is_primary,
    ss.experience_level,
    ss.price_modifier,
    svc.price * ss.price_modifier as staff_service_price
  FROM public.services svc
  INNER JOIN public.staff_services ss ON svc.id = ss.service_id
  WHERE ss.staff_id = staff_id_param
    AND ss.is_active = true
  ORDER BY ss.is_primary DESC, svc.name;
END;
$$ LANGUAGE plpgsql; 
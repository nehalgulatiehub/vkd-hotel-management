-- Import transporters from legacy data
INSERT INTO public.transporters (name, phone, email, company_name, notes, vehicle_types) VALUES
('Bhuwan Safari', '9639779869', '', 'Bhuwan Safari Ramnagar', 'Corbett local safari and taxi services', ARRAY['car', 'tempo_traveller']),
('Safari Corbett Traveller', '9837018105', '', 'Safari Corbett Traveller', 'Local taxi and tempo services in Corbett', ARRAY['car', 'tempo_traveller']),
('Hungry Bag Tour Travels', '9717130808', 'hungrybag@gmail.com', 'Hungry Bag Tour Travels', 'Travshop partner for packages', ARRAY['bus', 'car', 'tempo_traveller']),
('Tanishq Holidays', '9999999999', 'tanishq@holidays.com', 'Tanishq Holidays', 'Volvo and taxi bookings Delhi-Manali-Delhi', ARRAY['bus', 'car']),
('Travshop', '9876543210', 'contact@travshop.in', 'Travshop', 'Main transport partner for multi-city tours', ARRAY['bus', 'car', 'tempo_traveller']),
('Travel Satish Point', '9654877331', '', 'Travel Satish Point NSP', 'Delhi NCR transport partner', ARRAY['bus', 'car']),
('Sakkarwal Travels', '', '', 'Sakkarwal Travels', 'Dubai visa and international services', ARRAY['other']),
('TBO', '', '', 'TBO Tek Limited', 'Flight and hotel bookings B2B', ARRAY['other']),
('Unique Travel Point', '8076017737', 'uniquetravelpoint@gmail.com', 'Unique Travel Point', 'Manali Mussoorie hotel bookings', ARRAY['car', 'tempo_traveller']),
('Sonia Travel', '', '', 'Sonia Travel', 'Local taxi services', ARRAY['car']),
('Incredible Odyssey', '9810564477', 'amit@incredibleodyssey.com', 'Incredible Odyssey Pte. Ltd.', 'International DMC partner', ARRAY['other']),
('D Resort Transport', '6396647252', 'reservations@corbettdresort', 'D Resort Jim Corbett', 'Hotel and local transport', ARRAY['car']),
('Indigo Airlines', '', '', 'Indigo Airlines', 'Flight bookings', ARRAY['other']);
-- Seed data for DataPlans table
-- MTN Plans
INSERT INTO "DataPlan" (id, name, "networkId", "networkName", "sizeLabel", validity, price, "userPrice", "agentPrice", "apiAId", "apiBId", "activeApi", "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), '1GB Daily', 1, 'MTN', '1GB', '24hrs', 500.00, 500.00, 450.00, 1, NULL, 'A', true, NOW(), NOW()),
  (gen_random_uuid(), '2GB Daily', 1, 'MTN', '2GB', '24hrs', 900.00, 900.00, 800.00, 2, NULL, 'A', true, NOW(), NOW()),
  (gen_random_uuid(), '5GB Weekly', 1, 'MTN', '5GB', '7 days', 2000.00, 2000.00, 1800.00, 3, NULL, 'A', true, NOW(), NOW()),
  (gen_random_uuid(), '10GB Monthly', 1, 'MTN', '10GB', '30 days', 4000.00, 4000.00, 3500.00, 4, NULL, 'A', true, NOW(), NOW()),
  
-- Glo Plans
  (gen_random_uuid(), '1GB Daily', 2, 'Glo', '1GB', '24hrs', 450.00, 450.00, 400.00, 5, NULL, 'A', true, NOW(), NOW()),
  (gen_random_uuid(), '2GB Daily', 2, 'Glo', '2GB', '24hrs', 800.00, 800.00, 700.00, 6, NULL, 'A', true, NOW(), NOW()),
  (gen_random_uuid(), '5GB Weekly', 2, 'Glo', '5GB', '7 days', 1800.00, 1800.00, 1600.00, 7, NULL, 'A', true, NOW(), NOW()),
  
-- 9mobile Plans
  (gen_random_uuid(), '1GB Daily', 3, '9mobile', '1GB', '24hrs', 400.00, 400.00, 350.00, 8, NULL, 'A', true, NOW(), NOW()),
  (gen_random_uuid(), '2GB Daily', 3, '9mobile', '2GB', '24hrs', 750.00, 750.00, 650.00, 9, NULL, 'A', true, NOW(), NOW()),
  
-- Airtel Plans
  (gen_random_uuid(), '1GB Daily', 4, 'Airtel', '1GB', '24hrs', 420.00, 420.00, 370.00, 10, NULL, 'A', true, NOW(), NOW()),
  (gen_random_uuid(), '2GB Daily', 4, 'Airtel', '2GB', '24hrs', 820.00, 820.00, 720.00, 11, NULL, 'A', true, NOW(), NOW());

-- Output message
SELECT 'Database seeded successfully with data plans' AS message;

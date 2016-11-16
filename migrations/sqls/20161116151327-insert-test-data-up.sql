INSERT INTO accounts ("name") 
SELECT CONCAT('TestDFSP', generate_series) as "name" 
FROM generate_series(1, 10)
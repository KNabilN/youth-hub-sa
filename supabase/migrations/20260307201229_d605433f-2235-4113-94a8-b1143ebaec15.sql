UPDATE projects SET deleted_at = now() WHERE id IN ('78d0695a-aaf6-4e97-af46-89139936b106', '2923c93f-a710-4caa-bd7e-94d8e0604368', '9f1f660d-cccd-4d4f-916b-0cd39e240579');

UPDATE micro_services SET deleted_at = now() WHERE id IN ('a49c3c8e-4d4d-40a9-9d9b-ce316063c40b', '4dd300b3-3f8b-4f8c-9825-29a6d7c8c621');
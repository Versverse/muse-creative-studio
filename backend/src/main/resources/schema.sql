CREATE TABLE IF NOT EXISTS templates (id VARCHAR(64) PRIMARY KEY, title VARCHAR(100) NOT NULL, category VARCHAR(50) NOT NULL, description VARCHAR(255) NOT NULL, cover_url VARCHAR(255) NOT NULL, required_image_count INT NOT NULL, max_file_size_bytes BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS tasks (id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(40) NOT NULL, template_id VARCHAR(64) NOT NULL, template_title VARCHAR(100) NOT NULL, status VARCHAR(20) NOT NULL, stage VARCHAR(30) NOT NULL, error VARCHAR(255), result_url VARCHAR(255), inputs TEXT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX idx_user_created (user_id,created_at));
INSERT IGNORE INTO templates VALUES
('postcard','旅行明信片','灵感海报','把旅途瞬间定格成一张有温度的明信片。','/covers/postcard.svg',1,5242880),
('duo','双人时光','人物写真','上传两张照片，珍藏彼此的美好时刻。','/covers/duo.svg',2,5242880),
('pet','毛茸茸日记','萌宠乐园','为你的毛孩子制作专属封面。','/covers/pet.svg',1,5242880),
('film','电影感瞬间','人物写真','让日常画面拥有电影海报的氛围。','/covers/film.svg',1,5242880),
('summer','夏日来信','灵感海报','把阳光与海风装进一张照片。','/covers/summer.svg',1,5242880),
('pet-duo','宠物搭档','萌宠乐园','上传两张照片，记录小伙伴的故事。','/covers/pet-duo.svg',2,5242880);

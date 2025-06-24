-- ZamanYönet Database Initialization Script
-- Created for Docker MySQL Container

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `randevu_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `randevu_db`;

-- Create user if not exists
CREATE USER IF NOT EXISTS 'randevu_user'@'%' IDENTIFIED BY 'randevu_pass';
GRANT ALL PRIVILEGES ON `randevu_db`.* TO 'randevu_user'@'%';
GRANT ALL PRIVILEGES ON `randevu_db`.* TO 'root'@'%';
FLUSH PRIVILEGES;

-- Set timezone
SET time_zone = '+00:00';

-- Enable event scheduler for log cleanup
SET GLOBAL event_scheduler = ON;

-- Create log cleanup event (runs daily at 2 AM)
DELIMITER //
CREATE EVENT IF NOT EXISTS `daily_log_cleanup`
ON SCHEDULE EVERY 1 DAY
STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 2 HOUR)
DO
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Log error but don't fail
        GET DIAGNOSTICS CONDITION 1
        @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
    END;

    -- Keep logs based on retention policy
    DELETE FROM system_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL 90 DAY);
    DELETE FROM performance_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);
    -- Keep security and audit logs longer
    DELETE FROM security_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL 365 DAY);
    DELETE FROM audit_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL 2555 DAY); -- 7 years
END //
DELIMITER ;

-- Optimize tables for better performance
SET GLOBAL innodb_buffer_pool_size = 256M;
SET GLOBAL innodb_log_file_size = 64M;
SET GLOBAL innodb_flush_log_at_trx_commit = 2;
SET GLOBAL query_cache_size = 32M;
SET GLOBAL query_cache_type = ON;

-- Create indexes for better performance (will be created when tables are made)
-- These will be added via SQLAlchemy models

SET FOREIGN_KEY_CHECKS = 1; 
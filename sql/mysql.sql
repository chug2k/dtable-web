
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dtable_uuid` varchar(36) NOT NULL,
  `row_id` varchar(36) NOT NULL,
  `op_user` varchar(255) NOT NULL,
  `op_type` varchar(128) NOT NULL,
  `op_time` datetime NOT NULL,
  `detail` text NOT NULL,
  `op_app` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_activities_op_time` (`op_time`),
  KEY `ix_activities_dtable_uuid` (`dtable_uuid`),
  KEY `ix_activities_row_id` (`row_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `activities` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_log_adminlog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(254) NOT NULL,
  `operation` varchar(255) NOT NULL,
  `detail` longtext NOT NULL,
  `datetime` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `admin_log_adminlog_email_7213c993` (`email`),
  KEY `admin_log_adminlog_operation_4bad7bd1` (`operation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `admin_log_adminlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_log_adminlog` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `api2_token` (
  `key` varchar(40) NOT NULL,
  `user` varchar(255) NOT NULL,
  `created` datetime(6) NOT NULL,
  PRIMARY KEY (`key`),
  UNIQUE KEY `user` (`user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `api2_token` DISABLE KEYS */;
/*!40000 ALTER TABLE `api2_token` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `api2_tokenv2` (
  `key` varchar(40) NOT NULL,
  `user` varchar(255) NOT NULL,
  `platform` varchar(32) NOT NULL,
  `device_id` varchar(40) NOT NULL,
  `device_name` varchar(40) NOT NULL,
  `platform_version` varchar(16) NOT NULL,
  `client_version` varchar(16) NOT NULL,
  `last_accessed` datetime(6) NOT NULL,
  `last_login_ip` char(39) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `wiped_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`key`),
  UNIQUE KEY `api2_tokenv2_user_platform_device_id_37005c24_uniq` (`user`,`platform`,`device_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `api2_tokenv2` DISABLE KEYS */;
/*!40000 ALTER TABLE `api2_tokenv2` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(80) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_group_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_permission` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int(11) NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=134 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add content type',1,'add_contenttype'),(2,'Can change content type',1,'change_contenttype'),(3,'Can delete content type',1,'delete_contenttype'),(4,'Can change config',2,'change_config'),(5,'Can add session',3,'add_session'),(6,'Can change session',3,'change_session'),(7,'Can delete session',3,'delete_session'),(8,'Can add commands last check',4,'add_commandslastcheck'),(9,'Can change commands last check',4,'change_commandslastcheck'),(10,'Can delete commands last check',4,'delete_commandslastcheck'),(11,'Can add social auth user',5,'add_socialauthuser'),(12,'Can change social auth user',5,'change_socialauthuser'),(13,'Can delete social auth user',5,'delete_socialauthuser'),(14,'Can add user last login',6,'add_userlastlogin'),(15,'Can change user last login',6,'change_userlastlogin'),(16,'Can delete user last login',6,'delete_userlastlogin'),(17,'Can add permission',7,'add_permission'),(18,'Can change permission',7,'change_permission'),(19,'Can delete permission',7,'delete_permission'),(20,'Can add group',8,'add_group'),(21,'Can change group',8,'change_group'),(22,'Can delete group',8,'delete_group'),(23,'Can add user',9,'add_user'),(24,'Can change user',9,'change_user'),(25,'Can delete user',9,'delete_user'),(26,'Can add captcha store',10,'add_captchastore'),(27,'Can change captcha store',10,'change_captchastore'),(28,'Can delete captcha store',10,'delete_captchastore'),(29,'Can add constance',11,'add_constance'),(30,'Can change constance',11,'change_constance'),(31,'Can delete constance',11,'delete_constance'),(32,'Can add Attachment',12,'add_attachment'),(33,'Can change Attachment',12,'change_attachment'),(34,'Can delete Attachment',12,'delete_attachment'),(35,'Can add Email',13,'add_email'),(36,'Can change Email',13,'change_email'),(37,'Can delete Email',13,'delete_email'),(38,'Can add Email Template',14,'add_emailtemplate'),(39,'Can change Email Template',14,'change_emailtemplate'),(40,'Can delete Email Template',14,'delete_emailtemplate'),(41,'Can add Log',15,'add_log'),(42,'Can change Log',15,'change_log'),(43,'Can delete Log',15,'delete_log'),(44,'Can add Terms and Conditions',16,'add_termsandconditions'),(45,'Can change Terms and Conditions',16,'change_termsandconditions'),(46,'Can delete Terms and Conditions',16,'delete_termsandconditions'),(47,'Can add User Terms and Conditions',17,'add_usertermsandconditions'),(48,'Can change User Terms and Conditions',17,'change_usertermsandconditions'),(49,'Can delete User Terms and Conditions',17,'delete_usertermsandconditions'),(50,'Can add token',18,'add_token'),(51,'Can change token',18,'change_token'),(52,'Can delete token',18,'delete_token'),(53,'Can add token v2',19,'add_tokenv2'),(54,'Can change token v2',19,'change_tokenv2'),(55,'Can delete token v2',19,'delete_tokenv2'),(56,'Can add avatar',20,'add_avatar'),(57,'Can change avatar',20,'change_avatar'),(58,'Can delete avatar',20,'delete_avatar'),(59,'Can add group avatar',21,'add_groupavatar'),(60,'Can change group avatar',21,'change_groupavatar'),(61,'Can delete group avatar',21,'delete_groupavatar'),(62,'Can add institution',22,'add_institution'),(63,'Can change institution',22,'change_institution'),(64,'Can delete institution',22,'delete_institution'),(65,'Can add institution admin',23,'add_institutionadmin'),(66,'Can change institution admin',23,'change_institutionadmin'),(67,'Can delete institution admin',23,'delete_institutionadmin'),(68,'Can add institution quota',24,'add_institutionquota'),(69,'Can change institution quota',24,'change_institutionquota'),(70,'Can delete institution quota',24,'delete_institutionquota'),(71,'Can add invitation',25,'add_invitation'),(72,'Can change invitation',25,'change_invitation'),(73,'Can delete invitation',25,'delete_invitation'),(74,'Can add notification',26,'add_notification'),(75,'Can change notification',26,'change_notification'),(76,'Can delete notification',26,'delete_notification'),(77,'Can add user notification',27,'add_usernotification'),(78,'Can change user notification',27,'change_usernotification'),(79,'Can delete user notification',27,'delete_usernotification'),(80,'Can add user options',28,'add_useroptions'),(81,'Can change user options',28,'change_useroptions'),(82,'Can delete user options',28,'delete_useroptions'),(83,'Can add profile',29,'add_profile'),(84,'Can change profile',29,'change_profile'),(85,'Can delete profile',29,'delete_profile'),(86,'Can add admin log',30,'add_adminlog'),(87,'Can change admin log',30,'change_adminlog'),(88,'Can delete admin log',30,'delete_adminlog'),(89,'Can add phone device',31,'add_phonedevice'),(90,'Can change phone device',31,'change_phonedevice'),(91,'Can delete phone device',31,'delete_phonedevice'),(92,'Can add static device',32,'add_staticdevice'),(93,'Can change static device',32,'change_staticdevice'),(94,'Can delete static device',32,'delete_staticdevice'),(95,'Can add static token',33,'add_statictoken'),(96,'Can change static token',33,'change_statictoken'),(97,'Can delete static token',33,'delete_statictoken'),(98,'Can add TOTP device',34,'add_totpdevice'),(99,'Can change TOTP device',34,'change_totpdevice'),(100,'Can delete TOTP device',34,'delete_totpdevice'),(101,'Can add admin role',35,'add_adminrole'),(102,'Can change admin role',35,'change_adminrole'),(103,'Can delete admin role',35,'delete_adminrole'),(104,'Can add d tables',36,'add_dtables'),(105,'Can change d tables',36,'change_dtables'),(106,'Can delete d tables',36,'delete_dtables'),(107,'Can add workspaces',37,'add_workspaces'),(108,'Can change workspaces',37,'change_workspaces'),(109,'Can delete workspaces',37,'delete_workspaces'),(110,'Can add d table share',38,'add_dtableshare'),(111,'Can change d table share',38,'change_dtableshare'),(112,'Can delete d table share',38,'delete_dtableshare'),(113,'Can add d table api token',39,'add_dtableapitoken'),(114,'Can change d table api token',39,'change_dtableapitoken'),(115,'Can delete d table api token',39,'delete_dtableapitoken'),(116,'Can add d table share links',40,'add_dtablesharelinks'),(117,'Can change d table share links',40,'change_dtablesharelinks'),(118,'Can delete d table share links',40,'delete_dtablesharelinks'),(119,'Can add d table form links',41,'add_dtableformlinks'),(120,'Can change d table form links',41,'change_dtableformlinks'),(121,'Can delete d table form links',41,'delete_dtableformlinks'),(122,'Can add d table row shares',42,'add_dtablerowshares'),(123,'Can change d table row shares',42,'change_dtablerowshares'),(124,'Can delete d table row shares',42,'delete_dtablerowshares'),(125,'Can add org member quota',43,'add_orgmemberquota'),(126,'Can change org member quota',43,'change_orgmemberquota'),(127,'Can delete org member quota',43,'delete_orgmemberquota'),(128,'Can add org settings',44,'add_orgsettings'),(129,'Can change org settings',44,'change_orgsettings'),(130,'Can delete org settings',44,'delete_orgsettings'),(131,'Can add registration profile',45,'add_registrationprofile'),(132,'Can change registration profile',45,'change_registrationprofile'),(133,'Can delete registration profile',45,'delete_registrationprofile');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(30) NOT NULL,
  `last_name` varchar(30) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `auth_user` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_user_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_group_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `auth_user_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_groups` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_user_user_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` (`user_id`,`permission_id`),
  KEY `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `auth_user_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_user_permissions` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `avatar_avatar` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `emailuser` varchar(255) NOT NULL,
  `primary` tinyint(1) NOT NULL,
  `avatar` varchar(1024) NOT NULL,
  `date_uploaded` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `avatar_avatar` DISABLE KEYS */;
/*!40000 ALTER TABLE `avatar_avatar` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `avatar_groupavatar` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` varchar(255) NOT NULL,
  `avatar` varchar(1024) NOT NULL,
  `date_uploaded` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `avatar_groupavatar` DISABLE KEYS */;
/*!40000 ALTER TABLE `avatar_groupavatar` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `base_commandslastcheck` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `command_type` varchar(100) NOT NULL,
  `last_check` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `base_commandslastcheck` DISABLE KEYS */;
/*!40000 ALTER TABLE `base_commandslastcheck` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `base_userlastlogin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `last_login` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `base_userlastlogin_username_270de06f` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `base_userlastlogin` DISABLE KEYS */;
/*!40000 ALTER TABLE `base_userlastlogin` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `captcha_captchastore` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `challenge` varchar(32) NOT NULL,
  `response` varchar(32) NOT NULL,
  `hashkey` varchar(40) NOT NULL,
  `expiration` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hashkey` (`hashkey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `captcha_captchastore` DISABLE KEYS */;
/*!40000 ALTER TABLE `captcha_captchastore` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `constance_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `constance_key` varchar(255) NOT NULL,
  `value` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `constance_key` (`constance_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `constance_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `constance_config` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_content_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (30,'admin_log','adminlog'),(18,'api2','token'),(19,'api2','tokenv2'),(8,'auth','group'),(7,'auth','permission'),(9,'auth','user'),(20,'avatar','avatar'),(21,'avatar','groupavatar'),(4,'base','commandslastcheck'),(5,'base','socialauthuser'),(6,'base','userlastlogin'),(10,'captcha','captchastore'),(2,'constance','config'),(1,'contenttypes','contenttype'),(11,'database','constance'),(39,'dtable','dtableapitoken'),(41,'dtable','dtableformlinks'),(42,'dtable','dtablerowshares'),(36,'dtable','dtables'),(38,'dtable','dtableshare'),(40,'dtable','dtablesharelinks'),(37,'dtable','workspaces'),(22,'institutions','institution'),(23,'institutions','institutionadmin'),(24,'institutions','institutionquota'),(25,'invitations','invitation'),(26,'notifications','notification'),(27,'notifications','usernotification'),(28,'options','useroptions'),(43,'organizations','orgmemberquota'),(44,'organizations','orgsettings'),(12,'post_office','attachment'),(13,'post_office','email'),(14,'post_office','emailtemplate'),(15,'post_office','log'),(29,'profile','profile'),(45,'registration','registrationprofile'),(35,'role_permissions','adminrole'),(3,'sessions','session'),(16,'termsandconditions','termsandconditions'),(17,'termsandconditions','usertermsandconditions'),(31,'two_factor','phonedevice'),(32,'two_factor','staticdevice'),(33,'two_factor','statictoken'),(34,'two_factor','totpdevice');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_migrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'admin_log','0001_initial','2019-11-08 06:35:53.219245'),(2,'api2','0001_initial','2019-11-08 06:35:53.323473'),(3,'contenttypes','0001_initial','2019-11-08 06:35:53.386478'),(4,'contenttypes','0002_remove_content_type_name','2019-11-08 06:35:53.465613'),(5,'auth','0001_initial','2019-11-08 06:35:54.046100'),(6,'auth','0002_alter_permission_name_max_length','2019-11-08 06:35:54.104176'),(7,'auth','0003_alter_user_email_max_length','2019-11-08 06:35:54.171273'),(8,'auth','0004_alter_user_username_opts','2019-11-08 06:35:54.184287'),(9,'auth','0005_alter_user_last_login_null','2019-11-08 06:35:54.229620'),(10,'auth','0006_require_contenttypes_0002','2019-11-08 06:35:54.238282'),(11,'auth','0007_alter_validators_add_error_messages','2019-11-08 06:35:54.250623'),(12,'auth','0008_alter_user_username_max_length','2019-11-08 06:35:54.310005'),(13,'avatar','0001_initial','2019-11-08 06:35:54.386320'),(14,'base','0001_initial','2019-11-08 06:35:54.537089'),(15,'captcha','0001_initial','2019-11-08 06:35:54.577019'),(16,'database','0001_initial','2019-11-08 06:35:54.618613'),(17,'database','0002_auto_20190129_2304','2019-11-08 06:35:54.667405'),(18,'dtable','0001_initial','2019-11-08 06:35:54.851437'),(19,'dtable','0002_auto','2019-11-08 06:35:54.994007'),(20,'dtable','0003_auto','2019-11-08 06:35:55.133840'),(21,'dtable','0004_sharedtablelink','2019-11-08 06:35:55.257235'),(22,'dtable','0005_dtableformlinks','2019-11-08 06:35:55.372744'),(23,'dtable','0006_dtablerowshares','2019-11-08 06:35:55.481031'),(24,'dtable','0007_workspaces_org_id','2019-11-08 06:35:55.510935'),(25,'group','0001_initial','2019-11-08 06:35:55.766627'),(26,'group','0002_auto_20191108_0635','2019-11-08 06:35:55.908549'),(27,'institutions','0001_initial','2019-11-08 06:35:56.029319'),(28,'institutions','0002_institutionquota','2019-11-08 06:35:56.124189'),(29,'institutions','0003_auto_20180426_0710','2019-11-08 06:35:56.176677'),(30,'invitations','0001_initial','2019-11-08 06:35:56.251118'),(31,'invitations','0002_invitation_invite_type','2019-11-08 06:35:56.279339'),(32,'invitations','0003_auto_20160510_1703','2019-11-08 06:35:56.322600'),(33,'invitations','0004_auto_20160629_1610','2019-11-08 06:35:56.371715'),(34,'invitations','0005_auto_20160629_1614','2019-11-08 06:35:56.396334'),(35,'notifications','0001_initial','2019-11-08 06:35:56.513296'),(36,'notifications','0002_auto_20180426_0710','2019-11-08 06:35:56.539902'),(37,'notifications','0003_auto_20181115_0825','2019-11-08 06:35:56.585483'),(38,'notifications','0004_auto_20191108_0635','2019-11-08 06:35:56.598223'),(39,'options','0001_initial','2019-11-08 06:35:56.664302'),(40,'options','0002_auto_20181107_0811','2019-11-08 06:35:56.690269'),(41,'organizations','0001_initial','2019-11-08 06:35:56.751245'),(42,'organizations','0002_orgsettings','2019-11-08 06:35:56.807661'),(43,'organizations','0003_auto_20190116_0323','2019-11-08 06:35:56.847965'),(44,'post_office','0001_initial','2019-11-08 06:35:57.345188'),(45,'post_office','0002_add_i18n_and_backend_alias','2019-11-08 06:35:57.559446'),(46,'post_office','0003_longer_subject','2019-11-08 06:35:57.595204'),(47,'post_office','0004_auto_20160607_0901','2019-11-08 06:35:58.017340'),(48,'post_office','0005_auto_20170515_0013','2019-11-08 06:35:58.065744'),(49,'post_office','0006_attachment_mimetype','2019-11-08 06:35:58.143677'),(50,'post_office','0007_auto_20170731_1342','2019-11-08 06:35:58.161135'),(51,'post_office','0008_attachment_headers','2019-11-08 06:35:58.197639'),(52,'profile','0001_initial','2019-11-08 06:35:58.308140'),(53,'profile','0002_auto_20190122_0225','2019-11-08 06:35:58.358521'),(54,'profile','0003_auto_20191108_0635','2019-11-08 06:35:58.374621'),(55,'registration','0001_initial','2019-11-08 06:35:58.425348'),(56,'role_permissions','0001_initial','2019-11-08 06:35:58.474448'),(57,'sessions','0001_initial','2019-11-08 06:35:58.548033'),(58,'termsandconditions','0001_initial','2019-11-08 06:35:58.726030'),(59,'termsandconditions','0002_auto_20191108_0635','2019-11-08 06:35:58.775103'),(60,'two_factor','0001_initial','2019-11-08 06:35:59.039964');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dtable_api_token` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app_name` varchar(255) NOT NULL,
  `token` varchar(40) NOT NULL,
  `generated_at` datetime(6) NOT NULL,
  `generated_by` varchar(255) NOT NULL,
  `last_access` datetime(6) NOT NULL,
  `permission` varchar(15) NOT NULL,
  `dtable_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  UNIQUE KEY `dtable_api_token_dtable_id_app_name_8594f458_uniq` (`dtable_id`,`app_name`),
  KEY `dtable_api_token_app_name_d80e8bcc` (`app_name`),
  CONSTRAINT `dtable_api_token_dtable_id_9a955fd6_fk_dtables_id` FOREIGN KEY (`dtable_id`) REFERENCES `dtables` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `dtable_api_token` DISABLE KEYS */;
/*!40000 ALTER TABLE `dtable_api_token` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `dtable_external_link` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dtable_id` int(11) NOT NULL,
  `token` varchar(100) NOT NULL,
  `creator` varchar(255) NOT NULL,
  `create_at` datetime(6) NOT NULL,
  `permission` varchar(50) NOT NULL,
  `view_cnt` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_key` (`token`),
  KEY `dtable_id_key` (`dtable_id`),
  CONSTRAINT `dtable_external_link_ibf83fk_1` FOREIGN KEY (`dtable_id`) REFERENCES `dtables` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `dtable_external_link` DISABLE KEYS */;
/*!40000 ALTER TABLE `dtable_external_link` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dtable_forms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `workspace_id` int(11) NOT NULL,
  `dtable_uuid` varchar(36) NOT NULL,
  `form_id` varchar(36) NOT NULL,
  `form_config` longtext DEFAULT NULL,
  `token` varchar(36) NOT NULL,
  `share_type` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  UNIQUE KEY `dtable_forms_dtable_uuid_form_id_51b8bb12_uniq` (`dtable_uuid`,`form_id`),
  KEY `dtable_forms_username_c507c6cc` (`username`),
  KEY `dtable_forms_workspace_id_2520d284` (`workspace_id`),
  KEY `dtable_forms_dtable_uuid_a4dbea23` (`dtable_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `dtable_forms` DISABLE KEYS */;
/*!40000 ALTER TABLE `dtable_forms` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dtable_form_share` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `form_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dtable_form_share_form_id_group_id_890fd26b_uniq` (`form_id`,`group_id`),
  KEY `dtable_form_share_group_id_68ef49a9` (`group_id`),
  CONSTRAINT `dtable_form_share_form_id_e3565e7d_fk_dtable_forms_id` FOREIGN KEY (`form_id`) REFERENCES `dtable_forms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `dtable_form_share` DISABLE KEYS */;
/*!40000 ALTER TABLE `dtable_form_share` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dtable_row_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `author` varchar(255) NOT NULL,
  `comment` longtext NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `dtable_uuid` char(32) NOT NULL,
  `row_id` char(36) NOT NULL DEFAULT '',
  `detail` longtext DEFAULT NULL,
  `resolved` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `dtable_uuid_key` (`dtable_uuid`),
  KEY `row_id_key` (`row_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `dtable_row_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `dtable_row_comments` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dtable_row_shares` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `workspace_id` int(11) NOT NULL,
  `dtable_uuid` varchar(36) NOT NULL,
  `table_id` varchar(36) NOT NULL,
  `row_id` varchar(36) NOT NULL,
  `token` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `dtable_row_shares_username_e02f884b` (`username`),
  KEY `dtable_row_shares_workspace_id_5f1b5daf` (`workspace_id`),
  KEY `dtable_row_shares_dtable_uuid_ea644d62` (`dtable_uuid`),
  KEY `dtable_row_shares_row_id_5d2bbe39` (`row_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `dtable_row_shares` DISABLE KEYS */;
/*!40000 ALTER TABLE `dtable_row_shares` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dtable_seafile_connectors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `seafile_url` varchar(255) NOT NULL,
  `repo_api_token` varchar(40) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `created_by` varchar(255) NOT NULL,
  `dtable_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dtable_seafile_connectors_dtable_id_repo_api_token_d657267a_uniq` (`dtable_id`,`repo_api_token`),
  KEY `dtable_seafile_connectors_repo_api_token_2de172f8` (`repo_api_token`),
  CONSTRAINT `dtable_seafile_connectors_dtable_id_613d5b8a_fk_dtables_id` FOREIGN KEY (`dtable_id`) REFERENCES `dtables` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `dtable_seafile_connectors` DISABLE KEYS */;
/*!40000 ALTER TABLE `dtable_seafile_connectors` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dtable_share` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `from_user` varchar(255) NOT NULL,
  `to_user` varchar(255) NOT NULL,
  `permission` varchar(15) NOT NULL,
  `dtable_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dtable_share_dtable_id_to_user_1ea3dc52_uniq` (`dtable_id`,`to_user`),
  KEY `dtable_share_from_user_4f7dc15d` (`from_user`),
  KEY `dtable_share_to_user_8d62bc4b` (`to_user`),
  CONSTRAINT `dtable_share_dtable_id_316d50ad_fk_dtables_id` FOREIGN KEY (`dtable_id`) REFERENCES `dtables` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `dtable_share` DISABLE KEYS */;
/*!40000 ALTER TABLE `dtable_share` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dtable_share_links` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `token` varchar(100) NOT NULL,
  `ctime` datetime(6) NOT NULL,
  `password` varchar(128) DEFAULT NULL,
  `expire_date` datetime(6) DEFAULT NULL,
  `permission` varchar(50) NOT NULL,
  `dtable_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `dtable_share_links_dtable_id_19974ba2_fk_dtables_id` (`dtable_id`),
  KEY `dtable_share_links_username_0fcbefa6` (`username`),
  KEY `dtable_share_links_permission_17ad74da` (`permission`),
  CONSTRAINT `dtable_share_links_dtable_id_19974ba2_fk_dtables_id` FOREIGN KEY (`dtable_id`) REFERENCES `dtables` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `dtable_share_links` DISABLE KEYS */;
/*!40000 ALTER TABLE `dtable_share_links` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dtable_snapshot` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `dtable_uuid` varchar(36) NOT NULL,
  `dtable_name` varchar(255) NOT NULL,
  `commit_id` varchar(40) NOT NULL,
  `ctime` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `commit_id` (`commit_id`),
  KEY `dtable_snapshot_dtable_uuid_57ef9f7f` (`dtable_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `dtable_snapshot` DISABLE KEYS */;
/*!40000 ALTER TABLE `dtable_snapshot` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dtables` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(32) NOT NULL,
  `name` varchar(255) NOT NULL,
  `creator` varchar(255) NOT NULL,
  `modifier` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `workspace_id` int(11) NOT NULL,
  `deleted` tinyint(1) NOT NULL DEFAULT 0,
  `delete_time` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `dtables_workspace_id_name_0b89d91b_uniq` (`workspace_id`,`name`),
  KEY `dtables_deleted_n3b4o5b2_key` (`deleted`),
  CONSTRAINT `dtables_workspace_id_538ecbbf_fk_workspaces_id` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `dtables` DISABLE KEYS */;
/*!40000 ALTER TABLE `dtables` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `operation_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dtable_uuid` varchar(32) NOT NULL,
  `op_id` bigint(20) NOT NULL,
  `op_time` bigint(20) NOT NULL,
  `operation` longtext NOT NULL,
  `author` varchar(255) NOT NULL,
  `app` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `operation_log_dtable_uuid` (`dtable_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `operation_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `operation_log` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `operation_checkpoint` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dtable_uuid` varchar(32) NOT NULL,
  `op_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dtable_uuid` (`dtable_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `operation_checkpoint` DISABLE KEYS */;
/*!40000 ALTER TABLE `operation_checkpoint` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `institutions_institution` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `create_time` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `institutions_institution` DISABLE KEYS */;
/*!40000 ALTER TABLE `institutions_institution` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `institutions_institutionadmin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` varchar(255) NOT NULL,
  `institution_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `institutions_institu_institution_id_1e9bb58b_fk_instituti` (`institution_id`),
  KEY `institutions_institutionadmin_user_c71d766d` (`user`),
  CONSTRAINT `institutions_institu_institution_id_1e9bb58b_fk_instituti` FOREIGN KEY (`institution_id`) REFERENCES `institutions_institution` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `institutions_institutionadmin` DISABLE KEYS */;
/*!40000 ALTER TABLE `institutions_institutionadmin` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `institutions_institutionquota` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quota` bigint(20) NOT NULL,
  `institution_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `institutions_institu_institution_id_d23201d9_fk_instituti` (`institution_id`),
  CONSTRAINT `institutions_institu_institution_id_d23201d9_fk_instituti` FOREIGN KEY (`institution_id`) REFERENCES `institutions_institution` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `institutions_institutionquota` DISABLE KEYS */;
/*!40000 ALTER TABLE `institutions_institutionquota` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invitations_invitation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(40) NOT NULL,
  `inviter` varchar(255) NOT NULL,
  `accepter` varchar(255) NOT NULL,
  `invite_time` datetime(6) NOT NULL,
  `accept_time` datetime(6) DEFAULT NULL,
  `invite_type` varchar(20) NOT NULL,
  `expire_time` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `invitations_invitation_inviter_b0a7b855` (`inviter`),
  KEY `invitations_invitation_token_25a92a38` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `invitations_invitation` DISABLE KEYS */;
/*!40000 ALTER TABLE `invitations_invitation` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications_notification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message` varchar(512) NOT NULL,
  `primary` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_notification_primary_4f95ec21` (`primary`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `notifications_notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications_notification` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications_usernotification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `to_user` varchar(255) NOT NULL,
  `msg_type` varchar(30) NOT NULL,
  `detail` longtext NOT NULL,
  `timestamp` datetime(6) NOT NULL,
  `seen` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_usernotification_to_user_6cadafa1` (`to_user`),
  KEY `notifications_usernotification_msg_type_985afd02` (`msg_type`),
  KEY `notifications_usernotification_timestamp_125067e8` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `notifications_usernotification` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications_usernotification` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `options_useroptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `option_key` varchar(50) NOT NULL,
  `option_val` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `options_useroptions_email_77d5726a` (`email`),
  KEY `options_useroptions_option_key_7bf7ae4b` (`option_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `options_useroptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `options_useroptions` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organizations_orgmemberquota` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `org_id` int(11) NOT NULL,
  `quota` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `organizations_orgmemberquota_org_id_93dde51d` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `organizations_orgmemberquota` DISABLE KEYS */;
/*!40000 ALTER TABLE `organizations_orgmemberquota` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organizations_orgsettings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `org_id` int(11) NOT NULL,
  `role` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `organizations_orgsettings_org_id_630f6843_uniq` (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `organizations_orgsettings` DISABLE KEYS */;
/*!40000 ALTER TABLE `organizations_orgsettings` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `post_office_attachment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `file` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `mimetype` varchar(255) NOT NULL,
  `headers` longtext DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `post_office_attachment` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_office_attachment` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `post_office_attachment_emails` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `attachment_id` int(11) NOT NULL,
  `email_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `post_office_attachment_e_attachment_id_email_id_8e046917_uniq` (`attachment_id`,`email_id`),
  KEY `post_office_attachme_email_id_96875fd9_fk_post_offi` (`email_id`),
  CONSTRAINT `post_office_attachme_attachment_id_6136fd9a_fk_post_offi` FOREIGN KEY (`attachment_id`) REFERENCES `post_office_attachment` (`id`),
  CONSTRAINT `post_office_attachme_email_id_96875fd9_fk_post_offi` FOREIGN KEY (`email_id`) REFERENCES `post_office_email` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `post_office_attachment_emails` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_office_attachment_emails` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `post_office_email` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from_email` varchar(254) NOT NULL,
  `to` longtext NOT NULL,
  `cc` longtext NOT NULL,
  `bcc` longtext NOT NULL,
  `subject` varchar(989) NOT NULL,
  `message` longtext NOT NULL,
  `html_message` longtext NOT NULL,
  `status` smallint(5) unsigned DEFAULT NULL,
  `priority` smallint(5) unsigned DEFAULT NULL,
  `created` datetime(6) NOT NULL,
  `last_updated` datetime(6) NOT NULL,
  `scheduled_time` datetime(6) DEFAULT NULL,
  `headers` longtext DEFAULT NULL,
  `context` longtext DEFAULT NULL,
  `template_id` int(11) DEFAULT NULL,
  `backend_alias` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `post_office_email_status_013a896c` (`status`),
  KEY `post_office_email_created_1306952f` (`created`),
  KEY `post_office_email_last_updated_0ffcec35` (`last_updated`),
  KEY `post_office_email_scheduled_time_3869ebec` (`scheduled_time`),
  KEY `post_office_email_template_id_417da7da_fk_post_offi` (`template_id`),
  CONSTRAINT `post_office_email_template_id_417da7da_fk_post_offi` FOREIGN KEY (`template_id`) REFERENCES `post_office_emailtemplate` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `post_office_email` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_office_email` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `post_office_emailtemplate` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` longtext NOT NULL,
  `subject` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `html_content` longtext NOT NULL,
  `created` datetime(6) NOT NULL,
  `last_updated` datetime(6) NOT NULL,
  `default_template_id` int(11) DEFAULT NULL,
  `language` varchar(12) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `post_office_emailtemplat_name_language_default_te_4023e3e4_uniq` (`name`,`language`,`default_template_id`),
  KEY `post_office_emailtem_default_template_id_2ac2f889_fk_post_offi` (`default_template_id`),
  CONSTRAINT `post_office_emailtem_default_template_id_2ac2f889_fk_post_offi` FOREIGN KEY (`default_template_id`) REFERENCES `post_office_emailtemplate` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `post_office_emailtemplate` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_office_emailtemplate` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `post_office_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` datetime(6) NOT NULL,
  `status` smallint(5) unsigned NOT NULL,
  `exception_type` varchar(255) NOT NULL,
  `message` longtext NOT NULL,
  `email_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `post_office_log_email_id_d42c8808_fk_post_office_email_id` (`email_id`),
  CONSTRAINT `post_office_log_email_id_d42c8808_fk_post_office_email_id` FOREIGN KEY (`email_id`) REFERENCES `post_office_email` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `post_office_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_office_log` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `profile_profile` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` varchar(254) NOT NULL,
  `nickname` varchar(64) NOT NULL,
  `intro` longtext NOT NULL,
  `lang_code` longtext DEFAULT NULL,
  `login_id` varchar(225) DEFAULT NULL,
  `contact_email` varchar(225) DEFAULT NULL,
  `institution` varchar(225) DEFAULT NULL,
  `list_in_address_book` tinyint(1) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user` (`user`),
  UNIQUE KEY `login_id` (`login_id`),
  UNIQUE KEY `profile_profile_contact_email_0975e4bf_uniq` (`contact_email`),
  UNIQUE KEY `phone` (`phone`),
  KEY `profile_profile_institution_c0286bd1` (`institution`),
  KEY `profile_profile_list_in_address_book_b1009a78` (`list_in_address_book`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `profile_profile` DISABLE KEYS */;
/*!40000 ALTER TABLE `profile_profile` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;

ALTER TABLE `profile_profile` CHANGE  `nickname` `nickname` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

CREATE TABLE `registration_registrationprofile` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `emailuser_id` int(11) NOT NULL,
  `activation_key` varchar(40) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `registration_registrationprofile` DISABLE KEYS */;
/*!40000 ALTER TABLE `registration_registrationprofile` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_permissions_adminrole` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(254) NOT NULL,
  `role` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `role_permissions_adminrole` DISABLE KEYS */;
/*!40000 ALTER TABLE `role_permissions_adminrole` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `social_auth_usersocialauth` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `provider` varchar(32) NOT NULL,
  `uid` varchar(255) NOT NULL,
  `extra_data` longtext NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `social_auth_usersocialauth_provider_uid_e6b5e668_uniq` (`provider`,`uid`),
  KEY `social_auth_usersocialauth_username_3f06b5cf` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `social_auth_usersocialauth` DISABLE KEYS */;
/*!40000 ALTER TABLE `social_auth_usersocialauth` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sysadmin_extra_userloginlog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `login_date` datetime(6) NOT NULL,
  `login_ip` varchar(128) NOT NULL,
  `login_success` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sysadmin_extra_userloginlog_username_5748b9e3` (`username`),
  KEY `sysadmin_extra_userloginlog_login_date_c171d790` (`login_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `sysadmin_extra_userloginlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `sysadmin_extra_userloginlog` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `termsandconditions_termsandconditions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(50) NOT NULL,
  `name` longtext NOT NULL,
  `version_number` decimal(6,2) NOT NULL,
  `text` longtext DEFAULT NULL,
  `info` longtext DEFAULT NULL,
  `date_active` datetime(6) DEFAULT NULL,
  `date_created` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `termsandconditions_termsandconditions_slug_489d1e9d` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `termsandconditions_termsandconditions` DISABLE KEYS */;
/*!40000 ALTER TABLE `termsandconditions_termsandconditions` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `termsandconditions_usertermsandconditions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `ip_address` char(39) DEFAULT NULL,
  `date_accepted` datetime(6) NOT NULL,
  `terms_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `termsandconditions_usert_username_terms_id_a7dabb70_uniq` (`username`,`terms_id`),
  KEY `termsandconditions_u_terms_id_eacdbcc7_fk_termsandc` (`terms_id`),
  CONSTRAINT `termsandconditions_u_terms_id_eacdbcc7_fk_termsandc` FOREIGN KEY (`terms_id`) REFERENCES `termsandconditions_termsandconditions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `termsandconditions_usertermsandconditions` DISABLE KEYS */;
/*!40000 ALTER TABLE `termsandconditions_usertermsandconditions` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `two_factor_phonedevice` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` varchar(255) NOT NULL,
  `name` varchar(64) NOT NULL,
  `confirmed` tinyint(1) NOT NULL,
  `number` varchar(40) NOT NULL,
  `key` varchar(40) NOT NULL,
  `method` varchar(4) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user` (`user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `two_factor_phonedevice` DISABLE KEYS */;
/*!40000 ALTER TABLE `two_factor_phonedevice` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `two_factor_staticdevice` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` varchar(255) NOT NULL,
  `name` varchar(64) NOT NULL,
  `confirmed` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user` (`user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `two_factor_staticdevice` DISABLE KEYS */;
/*!40000 ALTER TABLE `two_factor_staticdevice` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `two_factor_statictoken` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(16) NOT NULL,
  `device_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `two_factor_statictok_device_id_93095b45_fk_two_facto` (`device_id`),
  KEY `two_factor_statictoken_token_2ade1084` (`token`),
  CONSTRAINT `two_factor_statictok_device_id_93095b45_fk_two_facto` FOREIGN KEY (`device_id`) REFERENCES `two_factor_staticdevice` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `two_factor_statictoken` DISABLE KEYS */;
/*!40000 ALTER TABLE `two_factor_statictoken` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `two_factor_totpdevice` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user` varchar(255) NOT NULL,
  `name` varchar(64) NOT NULL,
  `confirmed` tinyint(1) NOT NULL,
  `key` varchar(80) NOT NULL,
  `step` smallint(5) unsigned NOT NULL,
  `t0` bigint(20) NOT NULL,
  `digits` smallint(5) unsigned NOT NULL,
  `tolerance` smallint(5) unsigned NOT NULL,
  `drift` smallint(6) NOT NULL,
  `last_t` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user` (`user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `two_factor_totpdevice` DISABLE KEYS */;
/*!40000 ALTER TABLE `two_factor_totpdevice` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `activity_id` int(11) DEFAULT NULL,
  `username` varchar(255) NOT NULL,
  `timestamp` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `activity_id` (`activity_id`),
  KEY `ix_user_activities_timestamp` (`timestamp`),
  CONSTRAINT `user_activities_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `user_activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_activities` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_activity_statistics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_time_md5` varchar(32) DEFAULT NULL,
  `username` varchar(255) NOT NULL,
  `timestamp` datetime NOT NULL,
  `org_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_time_md5` (`user_time_md5`),
  KEY `ix_user_activity_statistics_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `user_activity_statistics` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_activity_statistics` ENABLE KEYS */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `workspaces` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `owner` varchar(255) NOT NULL,
  `repo_id` varchar(36) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `org_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `owner` (`owner`),
  UNIQUE KEY `repo_id` (`repo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40000 ALTER TABLE `workspaces` DISABLE KEYS */;
/*!40000 ALTER TABLE `workspaces` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

CREATE TABLE IF NOT EXISTS `dtable_plugin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `added_by` varchar(255) NOT NULL,
  `added_time` datetime(6) NOT NULL,
  `dtable_id` int(11) NOT NULL,
  `info` longtext NOT NULL,
  PRIMARY KEY (`id`),
  KEY `dtable_plugin_dtable_id_60e96e09_fk_dtables_id` (`dtable_id`),
  KEY `dtable_plugin_name_244402d2` (`name`),
  CONSTRAINT `dtable_plugin_dtable_id_60e96e09_fk_dtables_id` FOREIGN KEY (`dtable_id`) REFERENCES `dtables` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `dtable_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `dtable_uuid` varchar(32) NOT NULL,
  `msg_type` varchar(40) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `detail` longtext NOT NULL,
  `seen` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `dtable_notifications_username` (`username`),
  KEY `dtable_notifications_dtable_uuid` (`dtable_uuid`),
  KEY `dtable_notifications_seen` (`seen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `dtable_common_dataset` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `org_id` int(11) NOT NULL,
  `dtable_uuid` char(32) NOT NULL,
  `table_id` varchar(36) NOT NULL,
  `view_id` varchar(36) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `creator` varchar(255) NOT NULL,
  `dataset_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dtable_common_dataset_org_id_dtable_uuid_table_7a02fe88_uniq` (`org_id`,`dtable_uuid`,`table_id`,`view_id`),
  UNIQUE KEY `dtable_common_dataset_org_id_dataset_name_f98dea4a_uniq` (`org_id`,`dataset_name`),
  KEY `dtable_common_dataset_dtable_uuid_780a1b12` (`dtable_uuid`),
  KEY `dtable_common_dataset_creator_6dc5b17d` (`creator`),
  KEY `dtable_common_dataset_dataset_name_6cfd12e6` (`dataset_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `dtable_common_dataset_group_access` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `dataset_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `dtable_common_datase_dataset_id_c7dfe110_fk_dtable_co` (`dataset_id`),
  KEY `dtable_common_dataset_group_access_group_id_1598fb59` (`group_id`),
  CONSTRAINT `dtable_common_datase_dataset_id_c7dfe110_fk_dtable_co` FOREIGN KEY (`dataset_id`) REFERENCES `dtable_common_dataset` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `dtable_group_share` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dtable_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `permission` varchar(15) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `created_by` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dtable_group_share_dtable_id_group_id_p0o3n6x7_uniq` (`dtable_id`,`group_id`),
  KEY `dtable_group_share_dtable_id_k3n4n5y2` (`dtable_id`),
  KEY `dtable_group_share_group_id_a7q9o2p3` (`group_id`),
  CONSTRAINT `dtable_group_share_dtable_id_nao83b6s_fk_dtables_id` FOREIGN KEY (`dtable_id`) REFERENCES `dtables` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `user_starred_dtables` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(254) NOT NULL,
  `dtable_uuid` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_starred_dtables_email_dtable_uuid_n8s7b3s0_uniq` (`email`,`dtable_uuid`),
  KEY `user_starred_dtables_dtable_uuid_n3s8l4n8` (`dtable_uuid`),
  KEY `user_starred_dtables_email_n9x0l3n8` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

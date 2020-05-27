

(function(globals) {

  var django = globals.django || (globals.django = {});

  
  django.pluralidx = function(n) {
    var v=(n > 1);
    if (typeof(v) == 'boolean') {
      return v ? 1 : 0;
    } else {
      return v;
    }
  };
  

  /* gettext library */

  django.catalog = django.catalog || {};
  
  var newcatalog = {
    "Access Log": "Fichier journaux",
    "Active": "Actif",
    "Active Users": "Utilisateurs actifs",
    "Activities": "Activit\u00e9s",
    "Activity details": "D\u00e9tails de l'activit\u00e9",
    "Add Admins": "Ajouter des administrateurs",
    "Add Member": "Ajouter un membre",
    "Add User": "Ajouter un utlisateur",
    "Add admin": "Ajouter un administrateur",
    "Add group member": "Ajouter un membre au groupe",
    "Add user": "Ajouter un utilisateur",
    "Added user {user}": "Utilisateur {user} ajout\u00e9",
    "Admin": "Administration",
    "Admin Logs": "Logs admin",
    "Admin access": "Acc\u00e8s administrateur",
    "All": "Toutes",
    "All Groups": "Tous les groupes",
    "An integer that is greater than 0 or equal to -2.": "Un nombre entier sup\u00e9rieur \u00e0 0 ou \u00e9gal \u00e0 -2.",
    "Are you sure to delete": "\u00cates-vous certain de vouloir supprimer ?",
    "Are you sure you want to delete %s ?": "\u00cates-vous certain de vouloir supprimer %s ?",
    "Are you sure you want to delete {placeholder} ?": "\u00cates-vous certain de vouloir supprimer {placeholder} ?",
    "Are you sure you want to disconnect?": "\u00cates-vous certain de vouloir vous d\u00e9connecter ?",
    "Are you sure you want to unlink this device?": "\u00cates-vous certain de vouloir supprimer le lien vers l'appareil ?",
    "Avatar": "Avatar",
    "Avatar:": "Avatar :",
    "Besides Write permission, user can also share the library.": "Outre l'autorisation d'\u00e9criture, l'utilisateur peut \u00e9galement partager une biblioth\u00e8que.",
    "Cancel": "Annuler",
    "Close": "Fermer",
    "Comment": "Commentaire",
    "Confirm Password": "Confirmer le mot de passe",
    "Connect": "Coonecter",
    "Contact Email": "E-mail de contact",
    "Contact Email:": "E-mail de contact :",
    "Copy": "Copier",
    "Count": " Nombre de vues",
    "Create At / Last Login": "Cr\u00e9\u00e9 le / Derni\u00e8re connexion",
    "Create Group": "Cr\u00e9er un groupe",
    "Create Library": "Cr\u00e9er une biblioth\u00e8que",
    "Created At": "Cr\u00e9\u00e9 le",
    "Created group {group_name}": "Groupe {group_name} cr\u00e9\u00e9",
    "Created library {library_name} with {owner} as its owner": "Biblioth\u00e8que {library_name} cr\u00e9\u00e9e par {owner} en tant que propri\u00e9taire",
    "Creator": "Cr\u00e9ateur",
    "Delete": "Supprimer",
    "Delete Account": "Supprimer le compte",
    "Delete Department": "Supprimer le d\u00e9partement",
    "Delete File": "Supprimer le fichier",
    "Delete Group": "Supprimer un groupe",
    "Delete Library": "Supprimer une biblioth\u00e8que",
    "Delete Member": "Supprimer le membre",
    "Delete User": "Supprimer un utilisateur",
    "Delete files from this device the next time it comes online.": "Supprimer les fichiers de cet appareil la prochaine fois qu'il est en ligne.",
    "Deleted directories": "Dossiers supprim\u00e9s",
    "Deleted files": "Fichiers supprim\u00e9s",
    "Deleted group {group_name}": "Groupe {group_name} supprim\u00e9",
    "Deleted library {library_name}": "Biblioth\u00e8que {library_name} supprim\u00e9e",
    "Deleted user {user}": "Utilisateur {user} supprim\u00e9",
    "Departments": "D\u00e9partements",
    "Details": "D\u00e9tails",
    "Disable Two-Factor Authentication": "D\u00e9sactiver l'authentification \u00e0 deux facteurs",
    "Disconnect": "D\u00e9connecter",
    "Document convertion failed.": "\u00c9chec de conversion du document.",
    "Don't keep history": "Ne pas conserver d'historique",
    "Don't send emails": "Ne pas envoyer d'e-mails",
    "Download": "T\u00e9l\u00e9charger",
    "Edit": "Modifier",
    "Edit failed.": "L'\u00e9dition a \u00e9chou\u00e9.",
    "Edit on cloud and download": "\u00c9diter dans le cloud et t\u00e9l\u00e9charger",
    "Edit succeeded.": "\u00c9dit\u00e9 avec succ\u00e8s.",
    "Email": "E-mail",
    "Email Notification": "Notification par e-mail",
    "Emails, separated by ','": "E-mails, s\u00e9par\u00e9 par \",\"",
    "Enable Two-Factor Authentication": "Activer l'authentification \u00e0 deux facteurs",
    "Encrypted library": "Biblioth\u00e8que crypt\u00e9e",
    "Error": "Erreur",
    "Exit Organization Admin": "Quitter l'administration de l'Organisation",
    "Failed to copy %(name)s and %(amount)s other item(s).": "Impossible de copier %(name)s et %(amount)s autre(s) \u00e9l\u00e9ment(s).",
    "Failed to copy %(name)s.": "\u00c9chec de la copie de %(name)s",
    "Failed to move %(name)s and %(amount)s other item(s).": "Impossible de d\u00e9placer %(name)s et %(amount)s autre(s) \u00e9l\u00e9ment(s).",
    "Failed to move %(name)s.": "\u00c9chec du d\u00e9placement de %(name)s",
    "File Scan": "Analyse de fichier",
    "File extensions can only be {placeholder}.": "Les extensions de fichiers ne peuvent \u00eatre {placeholder}.",
    "Generate": "G\u00e9n\u00e9rer",
    "Global Address Book": "Carnet d'adresses global",
    "Group": "Groupe",
    "Group not found": "Groupe non trouv\u00e9",
    "Groups": "Groupes",
    "Help": "Aide",
    "History": "Historique",
    "History Setting": "Param\u00e8tres de l'historique",
    "IP": "IP",
    "If you don't have any device with you, you can access your account using backup codes.": "Si vous n'avez aucun appareil avec vous, vous pouvez acc\u00e9dez \u00e0 votre compte avec les codes de sauvegardes.",
    "Inactive": "Inactif",
    "Info": "Infos",
    "Institutions": "Institutions",
    "Invitations": "Invitations",
    "Invite People": "Inviter des personnes",
    "Invite link is copied to the clipboard.": "Le lien de invitation a \u00e9t\u00e9 copi\u00e9 dans le presse-papier",
    "Invite user": "Inviter un utilisateur",
    "It is required.": "C'est obligatoire",
    "Item": "Article",
    "Keep full history": "Conserver un historique complet",
    "Language": "Langue",
    "Language Setting": "Langue",
    "Last Access": "Dernier acc\u00e8s",
    "Last Update": "Mise \u00e0 jour",
    "Leave Share": "D\u00e9sactiver le partage",
    "Library can not be shared to owner.": "La biblioth\u00e8que ne peut pas \u00eatre partag\u00e9e par son propri\u00e9taire",
    "Limits": "Limites",
    "Link": "Lien",
    "Link has been copied to clipboard": "Le lien a \u00e9t\u00e9 copi\u00e9 dans le presse-papier",
    "List your account in global address book, so that others can find you by typing your name.": "Inscrivez votre compte dans le carnet d'adresses global, ainsi les autres pourront vous trouver en saisissant votre nom.",
    "Lock": "Verrouiller",
    "Log out": "D\u00e9connexion",
    "Login again.": "Se reconnecter.",
    "Logs": "Logs",
    "Manage Members": "Gestion des membres",
    "Manage group members": "Gestion des membres du groupe",
    "Member": "Membre",
    "Members": "Membres",
    "Message (optional):": "Message (optionnel) : ",
    "Modification Details": "D\u00e9tails de la modification",
    "Modified files": "Fichiers modifi\u00e9s",
    "More Operations": "Plus d'actions",
    "Move": "D\u00e9placer",
    "Name": "Nom",
    "Name is required": "Le nom est obligatoire",
    "Name is required.": "Le nom est requis.",
    "Name should not include '/'.": "Le nom ne peut inclure '/'.",
    "New Department": "Nouveau d\u00e9partement",
    "New File": "Nouveau fichier",
    "New Folder": "Nouveau dossier",
    "New Group": "Nouveau groupe",
    "New Library": "Nouvelle biblioth\u00e8que",
    "New Sub-department": "Nouveau sous-d\u00e9partement",
    "New directories": "Nouveaux dossiers",
    "New files": "Nouveaux fichiers",
    "Next": "Suivant",
    "No departments": "Pas de d\u00e9partement",
    "No members": "Pas de membre",
    "No results matching.": "Aucun r\u00e9sultat correspondant.",
    "No sub-departments": "Pas de sous-d\u00e9partement",
    "Notifications": "Notifications",
    "Online view is not applicable to this file format": "L'aper\u00e7u en ligne n'est pas disponible pour de type de fichier",
    "Only keep a period of history:": "Ne conserver qu'une p\u00e9riode de l'historique :",
    "Open via Client": "Ouvrir avec le client",
    "Operation": "Op\u00e9ration",
    "Operations": "Actions",
    "Organization": "Organisation",
    "Organization Admin": "Administration de l'organisation",
    "Organizations": "Organisations",
    "Owner": "Propri\u00e9taire",
    "Password": "Mot de passe",
    "Password again": "Mot de passe (\u00e0 nouveau)",
    "Password:": "Mot de passe :",
    "Passwords don't match": "Les mots de passe ne correspondent pas",
    "Per 4 hours": "Toutes les 4 heures",
    "Per day": "Tous les jours",
    "Per hour": "Toutes les heures",
    "Per week": "Toutes les semaines",
    "Permission": "Droit",
    "Permission denied": "Autorisation refus\u00e9e",
    "Please check the network.": "Veuillez v\u00e9rifier le r\u00e9seau.",
    "Please choose an image file.": "Veuillez s\u00e9lectionner un fichier image.",
    "Please enter a non-negative integer": "Veuillez introduire un int\u00e9grateur non-n\u00e9gatif",
    "Please enter password": "Entrez un mot de passe",
    "Please enter the password again": "Entrez \u00e0 nouveau un mot de passe",
    "Please input at least an email.": "Saisissez au moins une adresse e-mail.",
    "Preview and download": "Pr\u00e9visualiser et t\u00e9l\u00e9charger",
    "Preview only": "Aper\u00e7u uniquement",
    "Previous": "Pr\u00e9c\u00e9dent",
    "Private": "Priv\u00e9",
    "Profile": "Profil",
    "Profile Setting": "Profil",
    "Public": "Publique",
    "Quota": "Quota",
    "Quota is invalid.": "Le quota n'est pas valide.",
    "Read-Only": "Lecture seulement",
    "Read-Only folder": "Dossier en Lecture-Seulement",
    "Read-Only library": "Biblioth\u00e8que en lecture seule",
    "Read-Write": "Lecture - \u00c9criture",
    "Read-Write folder": "Dossier en Lecture-\u00c9criture",
    "Read-Write library": "Biblioth\u00e8que en lecture / \u00e9criture",
    "Really want to delete your account?": "Voulez-vous vraiment supprimer ce compte ?",
    "Related Files": "Fichiers relatifs",
    "Remove": "Supprimer",
    "Rename": "Renommer",
    "Rename Group": "Renommer le groupe",
    "Rename group to": "Renommer le groupe en ",
    "Renamed or Moved files": "Fichiers renomm\u00e9s ou d\u00e9plac\u00e9s",
    "Reset": "R\u00e9initialiser",
    "Reset Password": "R\u00e9initialisation du mot de passe",
    "ResetPwd": "R\u00e9initialisation mot de passe",
    "Restore": "Restaurer",
    "Revoke Admin": "R\u00e9voquer un administrateur",
    "Role": "R\u00f4le",
    "Saving...": "Sauvegarde ...",
    "Search users": "Chercher d'utilisateurs",
    "See All Notifications": "Voir toutes les notifications",
    "Select a department": "S\u00e9lectionner un d\u00e9partement",
    "Select a user as admin...": "D\u00e9finir un utilisateur en tant qu'administrateur...",
    "Select groups...": "S\u00e9lectionner les groupes...",
    "Select users...": "S\u00e9lectionner des utilisateurs...",
    "Send": "Envoyer",
    "Send to:": "Envoyer \u00e0 :",
    "Sending...": "Envoi ...",
    "Set Password": "D\u00e9finir un mot de passe",
    "Set Quota": "D\u00e9finir le quota",
    "Set user contact email": "D\u00e9finir l'e-mail de contact de l'utilisateur",
    "Set user name": "D\u00e9finir un nom d'utilisateur",
    "Settings": "Param\u00e8tres",
    "Share": "Partager",
    "Share to group": "Partager avec un groupe",
    "Share to user": "Partager avec l'utilisateur",
    "Shared with me": "Partag\u00e9 avec moi",
    "Show Codes": "Afficher les codes",
    "Size": "Taille",
    "Social Login": "Connexion r\u00e9seau social",
    "Space Used": "Espace utilis\u00e9",
    "Space Used / Quota": "Espace utilis\u00e9 / Quota",
    "Star": "Favoris",
    "Statistic": "Statistiques",
    "Status": "Statut",
    "Status: enabled": "Status : activ\u00e9",
    "Sub-departments": "Sous-d\u00e9partement",
    "Submit": "Soumettre",
    "Success": "Succ\u00e8s",
    "Successfully copied %(name)s and %(amount)s other items.": "%(name)s et %(amount)s autres \u00e9l\u00e9ments copi\u00e9s avec succ\u00e8s.",
    "Successfully copied %(name)s and 1 other item.": "%(name)s et 1 autre \u00e9l\u00e9ment copi\u00e9s avec succ\u00e8s.",
    "Successfully copied %(name)s.": "%(name)s copi\u00e9 avec succ\u00e8s.",
    "Successfully deleted %s": "%s a \u00e9t\u00e9 supprim\u00e9 avec succ\u00e8s.",
    "Successfully deleted 1 item.": "1 objet supprim\u00e9 avec succ\u00e8s",
    "Successfully deleted {name}": "{name} supprim\u00e9 avec succ\u00e8s",
    "Successfully deleted {name}.": "{name} a \u00e9t\u00e9 supprim\u00e9 avec succ\u00e8s.",
    "Successfully moved %(name)s and %(amount)s other items.": "%(name)s et %(amount)s autres \u00e9l\u00e9ments d\u00e9plac\u00e9s avec succ\u00e8s.",
    "Successfully moved %(name)s and 1 other item.": " %(name)s et 1 autre \u00e9l\u00e9ment d\u00e9plac\u00e9s avec succ\u00e8s.",
    "Successfully moved %(name)s.": " %(name)s d\u00e9plac\u00e9 avec succ\u00e8s.",
    "Successfully reset password to %(passwd)s for user %(user)s.": "Mot de passe de l'utilisateur %(user)s remplac\u00e9 par %(passwd)s avec succ\u00e8s.",
    "Successfully revoke the admin permission of %s": "Permissions administrateur de %s supprim\u00e9es avec succ\u00e8s",
    "Successfully sent to {placeholder}": "Envoy\u00e9 \u00e0 {placeholder} avec succ\u00e8s",
    "Successfully set %s as admin.": "%s d\u00e9fini en tant qu'administrateur avec succ\u00e8s.",
    "Successfully set library history.": "Mise \u00e0 jour de l'historique de la biblioth\u00e8que avec succ\u00e8s.",
    "Successfully transferred the group.": "Groupe transf\u00e9r\u00e9 avec succ\u00e8s.",
    "System Admin": "Administrateur syst\u00e8me",
    "Tags": "Tags",
    "Terms and Conditions": "Conditions d'utilisation",
    "The file is too large. Allowed maximum size is 1MB.": "Le fichier est trop volumineux. La taille maximum autoris\u00e9e est de 1 Mo.",
    "This operation will not be reverted. Please think twice!": "Cette action est irr\u00e9versible. Veuillez y r\u00e9fl\u00e9chir \u00e0 deux fois !",
    "Time": "Heure",
    "Tip: -2 means no limit.": "Astuce : -2 signifie illimit\u00e9.",
    "Tip: 0 means default limit": "Astuce : 0 signifie aucune limite par d\u00e9faut",
    "Total Users": "Utilisateurs totaux",
    "Transfer": "Transf\u00e9rer ",
    "Transfer Group": "Transf\u00e9rer un groupe",
    "Transfer Library": "Transf\u00e9rer une biblioth\u00e8que",
    "Transfer Library {library_name}": "Transf\u00e9rer la biblioth\u00e8que {library_name} ",
    "Transfer to department": "Transf\u00e9rer au d\u00e9partement ",
    "Transfer to user": "Transf\u00e9rer \u00e0 l'utilisateur ",
    "Transferred group {group_name} from {user_from} to {user_to}": "Le groupe {group_name} a \u00e9t\u00e9 transf\u00e9r\u00e9 de {user_from} \u00e0 {user_to}",
    "Transferred library {library_name} from {user_from} to {user_to}": "La biblioth\u00e8que {library_name} a \u00e9t\u00e9 transf\u00e9r\u00e9e de {user_from} \u00e0 {user_to}",
    "Trash": "Corbeille",
    "Two-Factor Authentication": "Authentification \u00e0 deux facteurs",
    "Two-factor authentication is not enabled for your account. Enable two-factor authentication for enhanced account security.": "La cl\u00e9 d'authentification \u00e0 deux facteurs n'est pas activ\u00e9e sur votre compte. Activez la cl\u00e9 d'authentification \u00e0 deux facteurs afin d'am\u00e9liorer la s\u00e9curit\u00e9 de votre compte.",
    "Unlink": "Annuler le lien",
    "Unlink device": "Supprimer le lien vers l'appareil",
    "Unlock": "D\u00e9verrouiller",
    "Unshare": "Annuler le partage",
    "Unstar": "D\u00e9cocher",
    "Update": "Mettre \u00e0 jour",
    "Used:": "Utilis\u00e9 :",
    "User": "Utilisateur",
    "User can only view files online via browser. Files can't be downloaded.": "L'utilisateur peut uniquement afficher les fichiers en ligne via un navigateur. Les fichiers ne peuvent pas \u00eatre t\u00e9l\u00e9charg\u00e9s.",
    "User can read, download and sync files.": "Vous pouvez lire, t\u00e9l\u00e9charger et synchroniser des fichiers.",
    "User can read, write, upload, download and sync files.": "L'utilisateur peut lire, \u00e9crire, envoyer, t\u00e9l\u00e9charger et synchroniser des fichiers.",
    "User can view and edit file online via browser. Files can't be downloaded.": "L'utilisateur peut voir et \u00e9diter un fichier en ligne via un navigateur. Les fichiers ne peuvent pas \u00eatre t\u00e9l\u00e9charg\u00e9s.",
    "User not found": "Utilisateur introuvable",
    "Username:": "Nom d'utilisateur :",
    "Users": "Utilisateurs",
    "Value": "Valeur",
    "View": "Voir",
    "WebDav Password": "Mot de passe WebDav ",
    "You are logged out.": "Vous \u00eates d\u00e9connect\u00e9.",
    "You can use this field at login.": "Vous pouvez utiliser ce champ \u00e0 la connexion.",
    "You have only one backup code remaining.": "Il ne vous reste qu'un seul code de sauvegarde.",
    "You have {num} backup codes remaining.": "Il vous reste {num} codes de sauvegarde.",
    "Your notifications will be sent to this email.": "Vos notifications seront envoy\u00e9es \u00e0 cette adresse e-mail.",
    "days": "jours",
    "email is required": "L'adresse e-mail est requise",
    "show more": "Voir plus",
    "successfully added user %s.": "L'utilisateur %s a \u00e9t\u00e9 ajout\u00e9 avec succ\u00e8s."
  };
  for (var key in newcatalog) {
    django.catalog[key] = newcatalog[key];
  }
  

  if (!django.jsi18n_initialized) {
    django.gettext = function(msgid) {
      var value = django.catalog[msgid];
      if (typeof(value) == 'undefined') {
        return msgid;
      } else {
        return (typeof(value) == 'string') ? value : value[0];
      }
    };

    django.ngettext = function(singular, plural, count) {
      var value = django.catalog[singular];
      if (typeof(value) == 'undefined') {
        return (count == 1) ? singular : plural;
      } else {
        return value[django.pluralidx(count)];
      }
    };

    django.gettext_noop = function(msgid) { return msgid; };

    django.pgettext = function(context, msgid) {
      var value = django.gettext(context + '\x04' + msgid);
      if (value.indexOf('\x04') != -1) {
        value = msgid;
      }
      return value;
    };

    django.npgettext = function(context, singular, plural, count) {
      var value = django.ngettext(context + '\x04' + singular, context + '\x04' + plural, count);
      if (value.indexOf('\x04') != -1) {
        value = django.ngettext(singular, plural, count);
      }
      return value;
    };

    django.interpolate = function(fmt, obj, named) {
      if (named) {
        return fmt.replace(/%\(\w+\)s/g, function(match){return String(obj[match.slice(2,-2)])});
      } else {
        return fmt.replace(/%s/g, function(match){return String(obj.shift())});
      }
    };


    /* formatting library */

    django.formats = {
    "DATETIME_FORMAT": "j F Y H:i",
    "DATETIME_INPUT_FORMATS": [
      "%d/%m/%Y %H:%M:%S",
      "%d/%m/%Y %H:%M:%S.%f",
      "%d/%m/%Y %H:%M",
      "%d/%m/%Y",
      "%d.%m.%Y %H:%M:%S",
      "%d.%m.%Y %H:%M:%S.%f",
      "%d.%m.%Y %H:%M",
      "%d.%m.%Y",
      "%Y-%m-%d %H:%M:%S",
      "%Y-%m-%d %H:%M:%S.%f",
      "%Y-%m-%d %H:%M",
      "%Y-%m-%d"
    ],
    "DATE_FORMAT": "j F Y",
    "DATE_INPUT_FORMATS": [
      "%d/%m/%Y",
      "%d/%m/%y",
      "%d.%m.%Y",
      "%d.%m.%y",
      "%Y-%m-%d"
    ],
    "DECIMAL_SEPARATOR": ",",
    "FIRST_DAY_OF_WEEK": "1",
    "MONTH_DAY_FORMAT": "j F",
    "NUMBER_GROUPING": "3",
    "SHORT_DATETIME_FORMAT": "j N Y H:i",
    "SHORT_DATE_FORMAT": "j N Y",
    "THOUSAND_SEPARATOR": "\u00a0",
    "TIME_FORMAT": "H:i",
    "TIME_INPUT_FORMATS": [
      "%H:%M:%S",
      "%H:%M:%S.%f",
      "%H:%M"
    ],
    "YEAR_MONTH_FORMAT": "F Y"
  };

    django.get_format = function(format_type) {
      var value = django.formats[format_type];
      if (typeof(value) == 'undefined') {
        return format_type;
      } else {
        return value;
      }
    };

    /* add to global namespace */
    globals.pluralidx = django.pluralidx;
    globals.gettext = django.gettext;
    globals.ngettext = django.ngettext;
    globals.gettext_noop = django.gettext_noop;
    globals.pgettext = django.pgettext;
    globals.npgettext = django.npgettext;
    globals.interpolate = django.interpolate;
    globals.get_format = django.get_format;

    django.jsi18n_initialized = true;
  }

}(this));




(function(globals) {

  var django = globals.django || (globals.django = {});

  
  django.pluralidx = function(n) {
    var v=(n != 1);
    if (typeof(v) == 'boolean') {
      return v ? 1 : 0;
    } else {
      return v;
    }
  };
  

  /* gettext library */

  django.catalog = django.catalog || {};
  
  var newcatalog = {
    "Access Log": "Nutzungsdaten",
    "Active": "Aktiv",
    "Active Users": "Aktive Benutzer/innen",
    "Activities": "Aktivit\u00e4ten",
    "Activity details": "Aktivit\u00e4tsdetails",
    "Add Admins": "Admins hinzuf\u00fcgen",
    "Add Member": "Mitglied hinzuf\u00fcgen",
    "Add User": "Benutzer hinzuf\u00fcgen",
    "Add admin": "Admin hinzuf\u00fcgen",
    "Add group member": "Gruppenmitglied hinzuf\u00fcgen",
    "Add user": "Hinzuf\u00fcgen",
    "Added user {user}": "Benutzer {user} hinzugef\u00fcgt",
    "Admin": "Administration",
    "Admin Logs": "Administrations-Protokolle",
    "Admin access": "Zugang f\u00fcr Administration",
    "All": "Alle",
    "All Groups": "Alle Gruppen",
    "An integer that is greater than 0 or equal to -2.": "Zahl gr\u00f6\u00dfer oder gleich 0 erforderlich, andernfalls -2.",
    "Are you sure to delete": "M\u00f6chten Sie dies wirklich l\u00f6schen",
    "Are you sure you want to delete %s ?": "M\u00f6chten Sie %s wirklich l\u00f6schen?",
    "Are you sure you want to delete {placeholder} ?": "M\u00f6chten Sie {placeholder} wirklich l\u00f6schen?",
    "Are you sure you want to disconnect?": "M\u00f6chten Sie die Verbindung wirklich trennen?",
    "Are you sure you want to unlink this device?": "M\u00f6chten Sie die Verbindung zu diesem Ger\u00e4t wirklich trennen?",
    "Avatar": "Avatar",
    "Avatar:": "Avatar",
    "Besides Write permission, user can also share the library.": "Schreiben und auch das Freigeben der Bibliothek ist erlaubt.",
    "Cancel": "Abbrechen",
    "Close": "Schlie\u00dfen",
    "Comment": "Kommentar",
    "Confirm Password": "Passwort best\u00e4tigen",
    "Connect": "Verbinden",
    "Contact Email": "E-Mail-Kontakt",
    "Contact Email:": "E-Mail-Kontakt:",
    "Copy": "Kopieren",
    "Count": "Zugriffe",
    "Create At / Last Login": "Erstellt am /\nLetzte Anmeldung",
    "Create Group": "Gruppe erstellen",
    "Create Library": "Bibliothek erstellen",
    "Created At": "Erstellt am",
    "Created group {group_name}": "Gruppe {group_name} erstellt",
    "Created library {library_name} with {owner} as its owner": "Bibliothek {library_name} mit {owner} als Eigent\u00fcmer/in erstellt",
    "Creator": "Eigent\u00fcmer/in",
    "Delete": "L\u00f6schen",
    "Delete Account": "Benutzerkonto l\u00f6schen",
    "Delete Department": "Bereich l\u00f6schen",
    "Delete File": "Datei l\u00f6schen",
    "Delete Group": "Gruppe l\u00f6schen",
    "Delete Library": "Bibliothek l\u00f6schen",
    "Delete Member": "Mitglied l\u00f6schen",
    "Delete User": "Benutzer l\u00f6schen",
    "Delete files from this device the next time it comes online.": "L\u00f6sche Dateien von diesem Ger\u00e4t, sobald es das n\u00e4chste Mal online ist.",
    "Deleted directories": "Gel\u00f6schte Ordner",
    "Deleted files": "Gel\u00f6schte Dateien",
    "Deleted group {group_name}": "Gruppe {group_name} gel\u00f6scht",
    "Deleted library {library_name}": "Bibliothek {library_name} gel\u00f6scht",
    "Deleted user {user}": "Benutzer {user} gel\u00f6scht",
    "Departments": "Bereiche",
    "Details": "Details",
    "Disable Two-Factor Authentication": "Zwei-Faktor-Authentifizierung deaktivieren",
    "Disconnect": "Trennen",
    "Document convertion failed.": "Dokumentenkonvertierung fehlgeschlagen.",
    "Don't keep history": "Versionen nicht speichern",
    "Don't send emails": "Keine E-Mails schicken",
    "Download": "Herunterladen",
    "Edit": "Bearbeiten",
    "Edit failed.": "Bearbeiten fehlgeschlagen.",
    "Edit on cloud and download": "Bearbeiten online und Herunterladen",
    "Edit succeeded.": "Bearbeitung gespeichert.",
    "Email": "E-Mail-Adresse",
    "Email Notification": "E-Mail-Benachrichtigung",
    "Emails, separated by ','": "E-Mail-Adressen, getrennt durch Komma",
    "Enable Two-Factor Authentication": "Zwei-Faktor-Authentifizierung aktivieren",
    "Encrypted library": "Verschl\u00fcsselte Bibliothek",
    "Error": "Fehler",
    "Exit Organization Admin": "Organisations-Administration verlassen",
    "Failed to copy %(name)s and %(amount)s other item(s).": "Fehler beim Kopieren von %(name)s und %(amount)s weiteren Objekten.",
    "Failed to copy %(name)s.": "Fehler beim Kopieren von %(name)s.",
    "Failed to move %(name)s and %(amount)s other item(s).": "Fehler beim Verschieben von %(name)s und %(amount)s weiteren Objekten.",
    "Failed to move %(name)s.": "Fehler beim Verschieben von %(name)s.",
    "Failed to send to {email_placeholder}: {errorMsg_placeholder}": "Senden an {email_placeholder} fehlgeschlagen: {errorMsg_placeholder}",
    "File Scan": "Scan der Dateien",
    "File extensions can only be {placeholder}.": "Dateiendung muss eine der folgenden sein: {placeholder}",
    "Generate": "Erstellen",
    "Global Address Book": "Zentrales Adressbuch",
    "Group": "Gruppe",
    "Group not found": "Gruppe nicht gefunden",
    "Groups": "Gruppen",
    "Help": "Hilfe",
    "History": "Versionen",
    "History Setting": "Versionen einrichten",
    "IP": "IP-Adresse",
    "If you don't have any device with you, you can access your account using backup codes.": "Falls Sie kein Ger\u00e4t bei sich haben, k\u00f6nnen Sie sich mit Ersatz-Codes einloggen.",
    "Inactive": "Inaktiv",
    "Info": "Info",
    "Institutions": "Einrichtungen",
    "Invitations": "Einladungen",
    "Invite People": "Benutzer/innen einladen",
    "Invite link is copied to the clipboard.": "Der Einladung-Link ist in die Zwischenablage kopiert.",
    "Invite user": "Benutzer/in einladen",
    "It is required.": "Erforderlich",
    "Item": "Artikel",
    "Keep full history": "Alle Versionen speichern",
    "Language": "Sprache",
    "Language Setting": "Spracheinstellung",
    "Last Access": "Letzter Zugriff",
    "Last Update": "Letzte \u00c4nderung",
    "Leave Share": "Freigegebene Bibliothek verlassen",
    "Library can not be shared to owner.": "Bibliotheken k\u00f6nnen nicht f\u00fcr ihre Eigent\u00fcmer/innen freigegeben werden.",
    "Limits": "Maximum",
    "Link": "Link",
    "Link has been copied to clipboard": "Der Link ist in den Zwischenspeicher kopiert",
    "List your account in global address book, so that others can find you by typing your name.": "Ihr Konto wird im zentralen Adressbuch aufgef\u00fchrt, damit andere Sie durch Eingabe Ihres Namens finden k\u00f6nnen.",
    "Lock": "Sperren",
    "Log out": "Abmelden",
    "Login again.": "Neu anmelden",
    "Logs": "Protokolle",
    "Manage Members": "Mitglieder verwalten",
    "Manage group members": "Gruppenmitglieder verwalten",
    "Member": "Mitglied",
    "Members": "Mitglieder",
    "Message (optional):": "Nachricht (optional):",
    "Modification Details": "Bearbeitungsdetails",
    "Modified files": "Ge\u00e4nderte Dateien",
    "More Operations": "Weitere Aktionen",
    "Move": "Verschieben",
    "Name": "Name",
    "Name is required": "Name erforderlich",
    "Name is required.": "Name erforderlich.",
    "Name should not include '/'.": "Name darf kein '/' enthalten",
    "New Department": "Neuer Bereich",
    "New File": "Neue Datei",
    "New Folder": "Neuer Ordner",
    "New Group": "Neue Gruppe",
    "New Library": "Neue Bibliothek",
    "New Sub-department": "Neuer Unterbereich",
    "New directories": "Neue Ordner",
    "New files": "Neue Dateien",
    "Next": "N\u00e4chste Seite",
    "No departments": "Keine Bereiche vorhanden",
    "No members": "Keine Mitglieder",
    "No results matching.": "Kein Ergebnis f\u00fcr die Suche.",
    "No sub-departments": "Keine Unterbereiche vorhanden",
    "Notifications": "Mitteilungen",
    "Online Read-Only": "Online Nur-Lesen",
    "Online Read-Only folder": "Online Nur-Lesen-Ordner",
    "Online Read-Only library": "Online Nur-Lesen-Bibliothek",
    "Online Read-Write": "Online Lesen+Schreiben",
    "Online Read-Write folder": "Online Lesen+Schreiben-Ordner",
    "Online Read-Write library": "Online Lesen+Schreiben-Bibliothek",
    "Online view is not applicable to this file format": "Vorschau ist f\u00fcr dieses Dateiformat nicht verf\u00fcgbar",
    "Only keep a period of history:": "Versionen nur f\u00fcr einen bestimmten Zeitraum speichern:",
    "Open via Client": "Lokal \u00f6ffnen",
    "Operation": "Aktion",
    "Operations": "Aktion",
    "Organization": "Organisation",
    "Organization Admin": "Administration",
    "Organizations": "Organisationen",
    "Owner": "Eigent\u00fcmer/in",
    "Password": "Passwort",
    "Password again": "Passwort erneut eingeben",
    "Password:": "Passwort:",
    "Passwords don't match": "Passw\u00f6rter stimmen nicht \u00fcberein",
    "Per 4 hours": "Alle 4 Stunden",
    "Per day": "T\u00e4glich",
    "Per hour": "St\u00fcndlich",
    "Per week": "W\u00f6chentlich",
    "Permission": "Rechte",
    "Permission denied": "Zugriff verweigert",
    "Please check the network.": "Bitte \u00fcberpr\u00fcfen Sie die Netzwerkverbindung.",
    "Please choose an image file.": "Bitte w\u00e4hlen Sie ein Bild aus.",
    "Please enter a non-negative integer": "Bitte geben Sie eine Zahl gr\u00f6\u00dfer oder gleich Null ein",
    "Please enter password": "Bitte geben Sie ein Passwort ein",
    "Please enter the password again": "Bitte geben Sie das Passwort erneut ein",
    "Please input at least an email.": "Bitte geben Sie mindestens eine E-Mail-Adresse an.",
    "Preview and download": "Vorschau und Herunterladen",
    "Preview only": "Nur Vorschau erlaubt",
    "Previous": "Vorherige",
    "Private": "Privat",
    "Profile": "Profil",
    "Profile Setting": "Profileinstellungen",
    "Public": "\u00d6ffentlich",
    "Quota": "Speicherplatz",
    "Quota is invalid.": "Kein Speicherplatz verf\u00fcgbar.",
    "Read-Only": "Nur Lesen",
    "Read-Only folder": "Nur-Lesen-Ordner",
    "Read-Only library": "Bibliothek mit Lesezugriff",
    "Read-Write": "Lesen+Schreiben",
    "Read-Write folder": "Lesen+Schreiben-Ordner",
    "Read-Write library": "Bibliothek mit Lese- und Schreibzugriff",
    "Really want to delete your account?": "M\u00f6chten Sie Ihr Benutzerkonto wirklich l\u00f6schen?",
    "Related Files": "Zugeh\u00f6rige Dateien",
    "Remove": "Entfernen",
    "Rename": "Umbenennen",
    "Rename Group": "Gruppe umbenennen",
    "Rename group to": "Gruppe umbenennen in",
    "Renamed or Moved files": "Umbenannte oder verschobene Dateien",
    "Reset": "Zur\u00fccksetzen",
    "Reset Password": "Passwort zur\u00fccksetzen",
    "ResetPwd": "Passwort zur\u00fccksetzen",
    "Restore": "Wiederherstellen",
    "Revoke Admin": "Adminrechte entziehen",
    "Role": "Rolle",
    "Saving...": "Speichere ...",
    "Search users": "Benutzer/innen suchen",
    "See All Notifications": "Alle Mitteilungen",
    "Select a department": "Bereich ausw\u00e4hlen",
    "Select a user as admin...": "Administrationsrechte zuweisen",
    "Select groups...": "Gruppen ausw\u00e4hlen \u2026",
    "Select users...": "Benutzer/innen ausw\u00e4hlen \u2026",
    "Send": "Senden",
    "Send to:": "Senden an:",
    "Sending...": "Wird gesendet \u2026",
    "Set Password": "Passwort vergeben",
    "Set Quota": "Speicherplatz setzen",
    "Set user contact email": "E-Mail-Adresse f\u00fcr Nutzer/in setzen",
    "Set user name": "Name f\u00fcr Nutzer/in setzen",
    "Set user quota": "Speicherquota setzen",
    "Settings": "Einstellungen",
    "Share": "Freigeben",
    "Share to group": "Freigabe f\u00fcr Gruppe",
    "Share to user": "Freigabe f\u00fcr Benutzer/in",
    "Shared with me": "F\u00fcr mich freigegeben",
    "Show Codes": "Codes anzeigen",
    "Size": "Gr\u00f6\u00dfe",
    "Social Login": "Anmelden mit Sozialen Diensten",
    "Space Used": "Benutzter Speicherplatz",
    "Space Used / Quota": "Benutzter Speicherplatz / Quota",
    "Star": "Favorisieren",
    "Statistic": "Statistik",
    "Status": "Status",
    "Status: enabled": "Status: aktiviert",
    "Sub-departments": "Unterbereiche",
    "Submit": "Absenden",
    "Success": "Erfolgreich ausgef\u00fchrt",
    "Successfully copied %(name)s and %(amount)s other items.": "%(name)s und %(amount)s weitere Objekte sind kopiert.",
    "Successfully copied %(name)s and 1 other item.": "%(name)s und ein weiteres Objekt sind kopiert.",
    "Successfully copied %(name)s.": "%(name)s ist kopiert.",
    "Successfully deleted %s": "%s ist gel\u00f6scht.",
    "Successfully deleted 1 item.": "1 Objekt erfolgreich gel\u00f6scht.",
    "Successfully deleted {name}": "{name} ist gel\u00f6scht.",
    "Successfully deleted {name}.": "{name} ist gel\u00f6scht.",
    "Successfully moved %(name)s and %(amount)s other items.": "%(name)s und %(amount)s weitere Objekte sind verschoben.",
    "Successfully moved %(name)s and 1 other item.": "%(name)s und ein weiteres Objekt sind verschoben.",
    "Successfully moved %(name)s.": "%(name)s ist verschoben.",
    "Successfully reset password to %(passwd)s for user %(user)s.": "Passwort von %(user)s auf %(passwd)s zur\u00fcckgesetzt.",
    "Successfully revoke the admin permission of %s": "%s sind die Adminrechte entzogen.",
    "Successfully sent to {placeholder}": "Erfolgreich an {placeholder} gesendet.",
    "Successfully set %s as admin.": "%s hat die Adminrechte verliehen bekommen.",
    "Successfully set library history.": "Versionierung f\u00fcr die Bibliothek eingestellt.",
    "Successfully transferred the group.": "Gruppe erfolgreich \u00fcbertragen.",
    "System Admin": "System-Administration",
    "Tags": "Tags",
    "Terms and Conditions": "Nutzungsvereinbarungen",
    "The file is too large. Allowed maximum size is 1MB.": " Die Datei ist zu gro\u00df. Die maximale Gr\u00f6\u00dfe betr\u00e4gt 1 MB.",
    "This operation will not be reverted. Please think twice!": "Dieser Vorgang kann nicht r\u00fcckg\u00e4ngig gemacht werden. Bitte seien Sie sicher, was Sie tun!",
    "Time": "Zeit",
    "Tip: -2 means no limit.": "Hinweis: -2 bedeutet ohne Limit.",
    "Tip: 0 means default limit": "Hinweis: 0 bedeutet Standardlimit",
    "Total Users": "Gesamtbenutzerzahl",
    "Transfer": "\u00dcbertragen",
    "Transfer Group": "Gruppe \u00fcbertragen",
    "Transfer Library": "Bibliothek \u00fcbertragen",
    "Transfer Library {library_name}": "\u00dcbertragen von Bibliothek {library_name}",
    "Transfer to department": "\u00dcbertragen auf Bereich",
    "Transfer to user": "\u00dcbertragen auf Benutzer/in",
    "Transferred group {group_name} from {user_from} to {user_to}": "Gruppe {group_name} von {user_from} \u00fcbertragen auf {user_to} ",
    "Transferred library {library_name} from {user_from} to {user_to}": "Bibliothek {library_name} von {user_from} \u00fcbertragen an {user_to} ",
    "Trash": "Papierkorb anzeigen",
    "Two-Factor Authentication": "Zwei-Faktor-Authentifizierung",
    "Two-factor authentication is not enabled for your account. Enable two-factor authentication for enhanced account security.": "Die Zwei-Faktor-Authentifizierung ist f\u00fcr Ihren Account nicht aktiviert. F\u00fcr einen zus\u00e4tzlichen Schutz Ihres Accounts aktivieren Sie die Zwei-Faktor-Authentifizierung.",
    "Unlink": "Verbindung trennen",
    "Unlink device": "Verbindung zum Ger\u00e4t trennen",
    "Unlock": "Entsperren",
    "Unshare": "Freigabe aufheben",
    "Unstar": "Aus Favoriten entfernen",
    "Update": "Aktualisieren",
    "Used:": "Verwendet:",
    "User": "Benutzer/in",
    "User can only view files online via browser. Files can't be downloaded.": "Nur das Anzeigen im Web-Browser ist erlaubt. Dateien k\u00f6nnen nicht heruntergeladen werden.",
    "User can read, download and sync files.": "Lesen, Herunterladen und Synchronisieren von Dateien erlaubt.",
    "User can read, write, upload, download and sync files.": "Lesen, Schreiben, Hochladen, Herunterladen und Synchronisieren von Dateien erlaubt.",
    "User can view and edit file online via browser. Files can't be downloaded.": "Nur das Anzeigen und Bearbeiten im Web-Browser ist erlaubt. Dateien k\u00f6nnen nicht heruntergeladen werden.",
    "User not found": "Benutzer/in nicht gefunden",
    "Username:": "Benutzername:",
    "Users": "Benutzer/innen",
    "Value": "Wert",
    "View": "Anzeigen",
    "WebDav Password": "Passwort f\u00fcr WebDav",
    "You are logged out.": "Sie haben sich abgemeldet.",
    "You can use this field at login.": "Dieses Feld k\u00f6nnen Sie zum Anmelden verwenden",
    "You have only one backup code remaining.": "Sie haben nur noch einen freien Ersatz-Code zur Verf\u00fcgung.",
    "You have {num} backup codes remaining.": "Sie haben noch {num} freie Ersatz-Codes.",
    "Your notifications will be sent to this email.": "Benachrichtigungen werden an diese E-Mail-Adresse geschickt.",
    "days": "Tage",
    "email is required": "E-Mail-Adresse erforderlich",
    "show more": "mehr \u2026",
    "successfully added user %s.": "%s wurde hinzugef\u00fcgt."
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
    "DATETIME_FORMAT": "j. F Y H:i",
    "DATETIME_INPUT_FORMATS": [
      "%d.%m.%Y %H:%M:%S",
      "%d.%m.%Y %H:%M:%S.%f",
      "%d.%m.%Y %H:%M",
      "%d.%m.%Y",
      "%Y-%m-%d %H:%M:%S",
      "%Y-%m-%d %H:%M:%S.%f",
      "%Y-%m-%d %H:%M",
      "%Y-%m-%d"
    ],
    "DATE_FORMAT": "j. F Y",
    "DATE_INPUT_FORMATS": [
      "%d.%m.%Y",
      "%d.%m.%y",
      "%Y-%m-%d"
    ],
    "DECIMAL_SEPARATOR": ",",
    "FIRST_DAY_OF_WEEK": "1",
    "MONTH_DAY_FORMAT": "j. F",
    "NUMBER_GROUPING": "3",
    "SHORT_DATETIME_FORMAT": "d.m.Y H:i",
    "SHORT_DATE_FORMAT": "d.m.Y",
    "THOUSAND_SEPARATOR": ".",
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


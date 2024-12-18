# Drive-by-fix

https://drive-by-fix.netlify.app

This is a "drive-by" fix to a Google Drive issue I experienced, specifically with its MacOS desktop app (in Sync, not Streaming, mode) failing to sync some files to local storage.  From the DriveFS logs the issue appears to be an invalid checksum carried in the Drive service's metadata.  Downloading the file contents and uploading it again fixes the issue.

This app automates the process of locating problematice files in DriveFS logs, locating these files in Drive, downloading them, and (after making a backup copy) reuploading them again if the checksum mismatches the Drive metadata.  (The user should then verify everything looks good before deleting the copies the app made.)

Why go through the trouble to make an app for this?  It's a fun exercise learning TS, React, gapi, Drive API, Netlify, OAuth etc.  Definitely overkill just for the use at hand.

Is this reusable to others?  Not out of the box.  drive-by-fix.netlify.app (at least as of 2024-12-17) serves the app, but the OAuth consent screen for the restricted Drive scope required by the app hasn't been published.  That would require a significant amount of work before being reviewed by Google, most likely only to be denied, because this is not a great use case for that scope.  It is a one-time need, just download and reupload the files manually through the Drive UI.  Problem files can be identified in the Drive desktop app's Sync Error list.  If this is too tedious in your case, feel free to reuse this code, or ask me for help. 

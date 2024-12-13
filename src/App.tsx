import { useEffect, useState } from 'react';
import { gapi } from 'gapi-script';
import FileDropZone from './FileDropZone';

const CLIENT_ID = '392411933975-mpmnrn4p6cmrkcnivu0drei0lv33snlc.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive';

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [filenames, setFilenames] = useState<string[]>([])

  useEffect(() => {
    function start() {
      gapi.client.init({
        clientId: CLIENT_ID,
        scope: SCOPES,
      }).then(() => {
        const authInstance = gapi.auth2.getAuthInstance();
        setIsSignedIn(authInstance.isSignedIn.get());

        authInstance.isSignedIn.listen(setIsSignedIn);
      });
    }
    gapi.load('client:auth2', start);
  }, []);

  const signIn = () => gapi.auth2.getAuthInstance().signIn();
  const signOut = () => gapi.auth2.getAuthInstance().signOut();

  const handleFilesDropped = async (files: File[]) => {
    const fns = new Set<string>();

    await Promise.all(
      files.map(
        (file) =>
          new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const content = e.target?.result as string;
              if (content) {
                const lines = content.split(/\r?\n/);
                lines.forEach((line) => {
                  /**  Example matching lines:
                  2024-12-12T19:52:47.177ZE [10019714:mirror_107800724247880349754] merger.cc:2189:CreateAndPersistLocalItem Creating [CloudItem: stable_id=[StableId: value=206] parent_stable_ids={[StableId: value=207]} filename="[CloudFilename: filename="example_problem.mp4"]" mtime=2024-12-12T19:45:50.001+00:00 md5_checksum="95e37ba643172d050267ddb77988c408" size=85626408 type=kRegularFile removed=false version=10 storage_policy=kUnknown shared=false read_only=false download_restricted=false in_shared_drive=false] failed with UNKNOWN: From legacy status [type.googleapis.com/drive.ds.Status='CONTENT_METADATA_MISMATCH']
                  2024-12-12T19:52:47.177ZE [10019714:mirror_107800724247880349754] error_handler.cc:350:HandleFailedChange [DownloadMergeQueueItem: attempts=17 stable_id=[StableId: value=206] source=kCloudScan] failed processing with UNKNOWN: From legacy status [type.googleapis.com/drive.ds.Status='CONTENT_METADATA_MISMATCH']
                  2024-12-12T19:53:04.439ZE [10019714:mirror_107800724247880349754] merger.cc:2189:CreateAndPersistLocalItem Creating [CloudItem: stable_id=[StableId: value=206] parent_stable_ids={[StableId: value=207]} filename="[CloudFilename: filename="example_problem.mp4"]" mtime=2024-12-12T19:45:50.001+00:00 md5_checksum="95e37ba643172d050267ddb77988c408" size=85626408 type=kRegularFile removed=false version=10 storage_policy=kUnknown shared=false read_only=false download_restricted=false in_shared_drive=false] failed with UNKNOWN: From legacy status [type.googleapis.com/drive.ds.Status='CONTENT_METADATA_MISMATCH']
                  2024-12-12T19:53:04.439ZE [10019714:mirror_107800724247880349754] error_handler.cc:350:HandleFailedChange [DownloadMergeQueueItem: attempts=18 stable_id=[StableId: value=206] source=kCloudScan] failed processing with UNKNOWN: From legacy status [type.googleapis.com/drive.ds.Status='CONTENT_METADATA_MISMATCH']
                  */
                  if (line.includes("'CONTENT_METADATA_MISMATCH'")) {
                    const match = line.match(/CloudFilename: filename="([^"]+)"/);
                    if (match) {
                      fns.add(match[1]);
                    }
                  }
                });
              }
              resolve();
            };
            reader.readAsText(file);
          })
      )
    );
    setFilenames(Array.from(fns).sort((a, b) => a.localeCompare(b)));
  };

  useEffect(() => {
    console.log(`filenames: ${JSON.stringify(filenames)}`);
  }, [filenames]);

  return (
    <div>
      <h1>Drive-by-fix</h1>
      {!isSignedIn ? (
        <button onClick={signIn}>Sign in with Google</button>
      ) : (
        <>
          <button onClick={signOut}>Sign out</button>
          <FileDropZone onFilesDropped={handleFilesDropped} />
        </>
      )}
    </div>
  );
}

export default App

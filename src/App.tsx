import React, { useEffect, useState } from 'react';
import { gapi } from 'gapi-script';
import FileDropZone from './FileDropZone';
import FilenameTable from './FilenameTable';

const CLIENT_ID = '392411933975-mpmnrn4p6cmrkcnivu0drei0lv33snlc.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

const steps = [
  "Sign in to Google Drive",
  "Upload DriveFS logs",
  "Locate files in Google Drive",
  "Fix files",
  "Completion",
];

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [filenames, setFilenames] = useState<string[]>([])
  const [activeStep, setActiveStep] = useState(isSignedIn ? 1 : 0);

  useEffect(() => {
    function start() {
      gapi.client.init({
        clientId: CLIENT_ID,
        scope: SCOPES,
        discoveryDocs: [DISCOVERY_DOC],
      }).then(() => {
        const authInstance = gapi.auth2.getAuthInstance();
        setIsSignedIn(authInstance.isSignedIn.get());

        authInstance.isSignedIn.listen(setIsSignedIn);
      });
    }
    gapi.load('client:auth2', start);
  }, []);

  const signIn = async () => {
    try {
      await gapi.auth2.getAuthInstance().signIn();
      setActiveStep(1);
    } catch (error) {
      console.error('Sign-in failed:', error);
    }
  };
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
    setActiveStep(2);
  };

  useEffect(() => {
    console.log(`filenames: ${JSON.stringify(filenames)}`);
  }, [filenames]);

  const restart = () => {
    window.location.reload();
  };

  const signOutAndReload = () => {
    signOut();
    window.location.reload();
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <button
            onClick={signIn}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg"
          >
            Sign in with Google
          </button>
        );
      case 1:
        return <FileDropZone onFilesDropped={handleFilesDropped} />;
      case 2:
        return <FilenameTable filenames={filenames} />;
      case 3:
        return <div className="text-gray-700 text-center">Fix files (dummy content)</div>;
      case 4:
        return <div className="text-gray-700 text-center">Completion screen (dummy content)</div>;
      default:
        return null;
    }
  };

  React.useEffect(() => {
    if (isSignedIn && activeStep === 0) {
      setActiveStep(1);
    }
  }, [isSignedIn]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-lg">
        <h1 className="text-2xl font-bold">Drive-by-fix</h1>
        {isSignedIn && (
          <div className="flex items-center space-x-4">
            {activeStep >= 1 && (
              <button
                onClick={restart}
                className="px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-400 shadow-md text-sm"
              >
                Restart
              </button>
            )}
            <button
              onClick={signOutAndReload}
              className="px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-400 shadow-md text-sm"
            >
              Sign out
            </button>
          </div>
        )}
      </header>

      {/* Wizard Steps */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full space-y-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`relative p-6 border rounded-lg ${index === activeStep
                ? "bg-white border-blue-600 shadow-lg w-4/5 mx-auto"
                : index < activeStep
                  ? "bg-green-100 border-green-600 text-gray-700 w-4/5 mx-auto"
                  : "bg-gray-100 border-gray-300 text-gray-500 w-4/5 mx-auto"
                }`}
            >
              <div className="flex items-center">
                <span className="mr-4 text-2xl">
                  {index < activeStep ? "✅" : index > activeStep ? "⏳" : ""}
                </span>
                <h2
                  className={`text-lg font-semibold ${index === activeStep ? "text-blue-600" : "text-gray-700"
                    }`}
                >
                  {step}
                </h2>
              </div>

              {index === activeStep && (
                <div className="mt-4">{renderStepContent(index)}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App

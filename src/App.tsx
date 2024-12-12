import { useEffect, useState } from 'react';
import { gapi } from 'gapi-script';

const CLIENT_ID = '392411933975-mpmnrn4p6cmrkcnivu0drei0lv33snlc.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive';

function App() {

  const [isSignedIn, setIsSignedIn] = useState(false);

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

  return (
    <div>
      <h1>Drive-by-fix</h1>
      {!isSignedIn ? (
        <button onClick={signIn}>Sign in with Google</button>
      ) : (
        <>
          <button onClick={signOut}>Sign out</button>
          <p>Signed in! You can now access Google Drive.</p>
        </>
      )}
    </div>
  );
}

export default App

import React, { useEffect, useRef, useState } from 'react';
import { DriveFile, findFile } from './drive';
import ProgressBar from './ProgressBar';
import pLimit from 'p-limit';

interface FilenameLookupProps {
    filenames: string[];
    onMatchesReady: (matches: { [key: string]: DriveFile[] }) => void;
}

const FilenameLookup: React.FC<FilenameLookupProps> = ({ filenames, onMatchesReady }) => {
    const [matches, setMatches] = useState<{ [key: string]: DriveFile[] }>({});
    const [progress, setProgress] = useState<number>(0);
    const processing = useRef(false);

    const handleLookup = async (filename: string) => {
        await findFile(filename);
        const foundMatches = await findFile(filename);
        setMatches((prevMatches) => ({
            ...prevMatches,
            [filename]: foundMatches,
        }));
    };;

    useEffect(() => {
        if (filenames && Object.keys(matches).length == filenames.length) {
            onMatchesReady(matches);
        }
    }, [matches, filenames, onMatchesReady]);

    useEffect(() => {
        const lookupAllFiles = async () => {
            const totalFiles = filenames.length;
            const limit = pLimit(10);

            let i = 0;
            const promises = filenames.map((filename) =>
                limit(async () => {
                    await handleLookup(filename);
                    setProgress(Math.round(((i + 1) / totalFiles) * 100));
                    i++;
                })
            );

            await Promise.all(promises);
            processing.current = false;
        };

        if (filenames && !processing.current) {
            processing.current = true;
            setMatches({});
            lookupAllFiles();
        }
    }, [filenames]);

    return (
        <div className="p-4 space-y-4">
            <ProgressBar percentage={progress} />
        </div>
    );
};

export default FilenameLookup;

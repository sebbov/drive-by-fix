import React, { useState } from 'react';

import { DriveFile, findFile } from './drive';

interface FilenameTableProps {
    // NB: If we stick to getting filenames only from drivefs logs, albeit
    // adding fragility on the log expectation end, we could robustify
    // matching with Drive files by taking other file attributes found
    // in logs into account.  The file size appears to be there.  The
    // checksum too, but the point is that we can't trust that. Avoiding
    // the fragility by making this an optional indication is possible,
    // but adds complexity that should probably be avoided.
    filenames: string[];
}

const FilenameTable: React.FC<FilenameTableProps> = ({ filenames }) => {
    const [matches, setMatches] = useState<{ [key: string]: DriveFile[] }>({});

    const handleLookup = async (filename: string) => {
        const foundMatches = await findFile(filename);
        setMatches((prevMatches) => ({
            ...prevMatches,
            [filename]: foundMatches,
        }));
    };

    const handleLookupAll = async () => {
        // TODO: Parallelize, to some degree.
        for (const filename of filenames) {
            await handleLookup(filename);
        };
    };

    return (
        <div>
            <button onClick={handleLookupAll}>Lookup All</button>

            <table>
                <thead>
                    <tr>
                        <th>Lookup</th>
                        <th>Filename</th>
                        <th>Drive Matches</th>
                    </tr>
                </thead>
                <tbody>
                    {filenames.map((filename) => (
                        <tr key={filename}>
                            <td>
                                <button onClick={() => handleLookup(filename)}>Action</button>
                            </td>
                            <td>{filename}</td>
                            <td>
                                {matches[filename]?.map((match, index) => (
                                    <div key={index}>{match.name} {match.size}B copy:{match.capabilities.canCopy ? 'true' : 'false'}</div>
                                )) || 'No matches yet'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FilenameTable;

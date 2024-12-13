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
    const [matches, setMatches] = useState<{ [key: string]: (DriveFile[] | null) }>({});
    const [allChecked, setAllChecked] = useState(true);
    const [checkedFiles, setCheckedFiles] = useState(new Set(filenames));

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
            if (checkedFiles.has(filename) && !matches[filename]) {
                await handleLookup(filename);
            }
        };
    };

    const handleMasterCheckboxChange = () => {
        setAllChecked(prevState => {
            const newState = !prevState;
            setCheckedFiles(newState ? new Set(filenames) : new Set());
            return newState;
        });
    };

    const handleRowCheckboxChange = (filename: string) => {
        setCheckedFiles(prevState => {
            const newCheckedFiles = new Set(prevState);
            if (newCheckedFiles.has(filename)) {
                newCheckedFiles.delete(filename);
            } else {
                newCheckedFiles.add(filename);
            }
            return newCheckedFiles;
        });
    };

    return (
        <div className="p-6 bg-gray-100">
            <button
                onClick={handleLookupAll}
                className="mb-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
            >
                Lookup
            </button>

            <table className="w-full table-auto bg-white shadow-md rounded border border-gray-300">
                <thead className="bg-gray-200 text-gray-700">
                    <tr>
                        <th className="px-4 py-2 text-left">
                            {/* Master checkbox to select/deselect all rows */}
                            <input
                                type="checkbox"
                                checked={allChecked}
                                onChange={handleMasterCheckboxChange}
                            />
                        </th>
                        <th className="px-4 py-2 text-left">Filename</th>
                        <th className="px-4 py-2 text-left">Drive Matches</th>
                    </tr>
                </thead>
                <tbody>
                    {filenames.map((filename, index) => (
                        <tr
                            key={filename}
                            className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"
                                } hover:bg-gray-100 transition`}
                        >
                            <td className="px-4 py-2">
                                {/* Checkbox for each row */}
                                <input
                                    type="checkbox"
                                    checked={checkedFiles.has(filename)}
                                    onChange={() => handleRowCheckboxChange(filename)}
                                />
                            </td>
                            <td className="px-4 py-2 text-gray-800">{filename}</td>
                            <td className="px-4 py-2">
                                {matches[filename] && matches[filename].length > 0 ? (
                                    matches[filename]?.map((match, index) => (
                                        <div key={index} className="text-sm text-gray-700">
                                            {match.name} {match.size}B{" "}
                                            <span
                                                className={`font-bold ${match.capabilities.canCopy ? "text-green-600" : "text-red-600"
                                                    }`}
                                            >
                                                copy: {match.capabilities.canCopy ? "true" : "false"}
                                            </span>
                                        </div>
                                    ))
                                ) : matches[filename]?.length == 0 ? (
                                    <div className="text-gray-800">No matches found.</div>
                                ) : (
                                    <div className="text-gray-400">Not looked up yet.</div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FilenameTable;

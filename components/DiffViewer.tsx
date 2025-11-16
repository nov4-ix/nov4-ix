import React from 'react';

interface DiffViewerProps {
  originalCode: string;
  newCode: string;
}

interface DiffLine {
  type: 'added' | 'removed' | 'same';
  text: string;
}

// A simple diffing function (not perfect, but good for this use case)
const createDiff = (original: string, updated: string): DiffLine[] => {
    const originalLines = original.split('\n');
    const updatedLines = updated.split('\n');
    const diff: DiffLine[] = [];
    const maxLen = Math.max(originalLines.length, updatedLines.length);
    let i = 0;
    let j = 0;

    while (i < originalLines.length || j < updatedLines.length) {
        const originalLine = originalLines[i];
        const updatedLine = updatedLines[j];

        if (i < originalLines.length && j < updatedLines.length && originalLine === updatedLine) {
            diff.push({ type: 'same', text: originalLine });
            i++;
            j++;
        } else {
            const originalIndex = updatedLines.indexOf(originalLine, j);
            const updatedIndex = originalLines.indexOf(updatedLine, i);

            if (originalIndex !== -1 && originalIndex - j < 5) { // Original line exists ahead in new file (lines added)
                while (j < originalIndex) {
                    diff.push({ type: 'added', text: updatedLines[j] });
                    j++;
                }
            } else if (updatedIndex !== -1 && updatedIndex - i < 5) { // New line exists ahead in old file (lines removed)
                 while (i < updatedIndex) {
                    diff.push({ type: 'removed', text: originalLines[i] });
                    i++;
                }
            } else { // Lines are just different
                if (i < originalLines.length) {
                    diff.push({ type: 'removed', text: originalLine });
                    i++;
                }
                 if (j < updatedLines.length) {
                    diff.push({ type: 'added', text: updatedLine });
                    j++;
                }
            }
        }
    }
    return diff;
};


const DiffViewer: React.FC<DiffViewerProps> = ({ originalCode, newCode }) => {
  const diffLines = createDiff(originalCode, newCode);

  return (
    <pre className="text-sm p-4 h-full overflow-auto">
      <code>
        {diffLines.map((line, index) => {
          let lineClass = '';
          let prefix = '  ';
          if (line.type === 'added') {
            lineClass = 'bg-[#15333B]/50 text-[#40FDAE]';
            prefix = '+ ';
          } else if (line.type === 'removed') {
            lineClass = 'bg-red-900/40 text-red-300';
            prefix = '- ';
          }
          return (
            <div key={index} className={lineClass}>
              <span className="select-none">{prefix}</span>
              {line.text}
            </div>
          );
        })}
      </code>
    </pre>
  );
};

export default DiffViewer;
import { DNASequence } from '@/types';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface DetailViewProps {
  sequence: DNASequence;
}

export function DetailView({ sequence }: DetailViewProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(sequence.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse DNA ID into layers
  const layers = sequence.id.split('-');
  const layerNames = [
    'GEO', 'IND', 'CLS', 'CDE', 'MFG', 'DIV', 'FAM', 'SYS',
    'MAT', 'SUB', 'ELE', 'PRF', 'EXP', 'FIX', 'CRT', 'RAT',
    'TMP', 'THK', 'ACC', 'SRC'
  ];

  return (
    <div className="space-y-6">
      {/* DNA ID */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">DNA Sequence ID</h4>
          <button
            onClick={copyToClipboard}
            className="flex items-center text-sm text-primary-600 hover:text-primary-700"
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                Copy
              </>
            )}
          </button>
        </div>
        <div className="dna-sequence p-3 text-sm">{sequence.id}</div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase">Rating</div>
          <div className={`mt-1 rating-badge rating-${sequence.data.rating} inline-flex`}>
            {sequence.data.rating}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase">Critical Temp</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">
            {sequence.data.crit_temp_C}°C
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase">Thickness</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">
            {sequence.data.thickness_mm} mm
          </div>
        </div>
      </div>

      {/* Technical Data */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Technical Specifications</h4>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Max Section Factor (Ap/V)</span>
            <span className="font-medium">{sequence.data.max_section_factor} m⁻¹</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Exposure</span>
            <span className="font-medium">
              {sequence.data.exposure === '3S' ? '3-Sided' : '4-Sided'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fixing Method</span>
            <span className="font-medium">{sequence.data.fixing}</span>
          </div>
        </div>
      </div>

      {/* Metadata */}
      {sequence.meta && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Source Information</h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {sequence.meta.manufacturer && (
              <div className="flex justify-between">
                <span className="text-gray-600">Manufacturer</span>
                <span className="font-medium">{sequence.meta.manufacturer}</span>
              </div>
            )}
            {sequence.meta.product_name && (
              <div className="flex justify-between">
                <span className="text-gray-600">Product</span>
                <span className="font-medium">{sequence.meta.product_name}</span>
              </div>
            )}
            {sequence.meta.compliance && (
              <div className="flex justify-between">
                <span className="text-gray-600">Compliance</span>
                <span className="font-medium">{sequence.meta.compliance}</span>
              </div>
            )}
            {sequence.meta.source_page && (
              <div className="flex justify-between">
                <span className="text-gray-600">Source Page</span>
                <span className="font-medium">{sequence.meta.source_page}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DNA Layer Breakdown */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">20-Layer DNA Breakdown</h4>
        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {layers.map((value, index) => (
              <div key={index} className="flex items-center">
                <span className="w-12 text-xs text-gray-400 font-mono">
                  L{String(index + 1).padStart(2, '0')}
                </span>
                <span className="w-10 text-xs font-medium text-gray-600">
                  {layerNames[index] || '???'}
                </span>
                <span className="font-mono text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

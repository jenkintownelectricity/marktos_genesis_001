import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  generateAICommandTemplate,
  generateTaxonomyFile,
  exportTaxonomy,
  PRODUCT_CATEGORY_TEMPLATES,
  ManufacturerConfig,
  ProductConfig,
  VariantConfig,
} from '../utils/taxonomyGenerator';
import { ProductCategory, ExportFormat } from '@/types';
import { useDataContext } from '@/app/providers/DataProvider';
import {
  DocumentTextIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'fire_protection', label: 'Fire Protection' },
  { value: 'insulation', label: 'Insulation' },
  { value: 'structural', label: 'Structural' },
  { value: 'cladding', label: 'Cladding' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'glazing', label: 'Glazing' },
  { value: 'doors_windows', label: 'Doors & Windows' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'finishes', label: 'Finishes' },
  { value: 'other', label: 'Other' },
];

interface FormData {
  // Manufacturer
  manufacturerName: string;
  manufacturerCode: string;
  division: string;
  family: string;
  region: string;
  // Product
  productSystem: string;
  systemCode: string;
  material: string;
  category: ProductCategory;
  certification: string;
  sourceDocument: string;
  // Variants (comma-separated)
  ratings: string;
  temperatures: string;
  thicknesses: string;
  exposures: string;
  fixings: string;
}

export function ManufacturerGenerator() {
  const { importTaxonomy } = useDataContext();
  const [generatedCommand, setGeneratedCommand] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'command' | 'generate'>('command');

  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      region: 'EU',
      category: 'fire_protection',
      ratings: 'R30, R45, R60, R90, R120, R180',
      temperatures: '450, 500, 550, 600, 650, 700',
      thicknesses: '20, 25, 30, 40, 50, 60, 70, 80, 90, 100',
      exposures: '3S, 4S',
      fixings: 'SCR, PIN, MEC',
    },
  });

  const category = watch('category');

  // Apply category template
  const applyTemplate = () => {
    const template = PRODUCT_CATEGORY_TEMPLATES[category];
    if (template.ratings) setValue('ratings', template.ratings.join(', '));
    if (template.temperatures) setValue('temperatures', template.temperatures.join(', '));
    if (template.thicknesses) setValue('thicknesses', template.thicknesses.join(', '));
    if (template.exposures) setValue('exposures', template.exposures.join(', '));
    if (template.fixings) setValue('fixings', template.fixings.join(', '));
  };

  const generateCommand = (data: FormData) => {
    const manufacturer: Partial<ManufacturerConfig> = {
      name: data.manufacturerName,
      code: data.manufacturerCode.toUpperCase(),
      division: data.division.toUpperCase(),
      family: data.family.toUpperCase(),
      region: data.region.toUpperCase(),
    };

    const product: Partial<ProductConfig> = {
      system: data.productSystem,
      systemCode: data.systemCode,
      material: data.material.toUpperCase(),
      certification: data.certification,
      sourceDocument: data.sourceDocument,
    };

    const command = generateAICommandTemplate(manufacturer, product, data.category);
    setGeneratedCommand(command);
  };

  const generateAndImport = async (data: FormData) => {
    const manufacturer: ManufacturerConfig = {
      name: data.manufacturerName,
      code: data.manufacturerCode.toUpperCase(),
      division: data.division.toUpperCase() || data.manufacturerCode.slice(0, 2).toUpperCase(),
      family: data.family.toUpperCase() || data.productSystem.slice(0, 2).toUpperCase(),
      region: data.region.toUpperCase(),
    };

    const product: ProductConfig = {
      system: data.productSystem,
      systemCode: data.systemCode,
      material: data.material.toUpperCase(),
      category: data.category,
      certification: data.certification,
      sourceDocument: data.sourceDocument,
    };

    const parseList = (str: string): string[] =>
      str.split(',').map((s) => s.trim()).filter(Boolean);

    const parseNumbers = (str: string): number[] =>
      str.split(',').map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));

    const variants: VariantConfig = {
      substrates: ['STL'],
      elements: ['GEN'],
      profiles: ['I'],
      exposures: parseList(data.exposures),
      fixings: parseList(data.fixings),
      ratings: parseList(data.ratings),
      temperatures: parseNumbers(data.temperatures),
      thicknesses: parseNumbers(data.thicknesses),
      accessories: ['SCR'],
    };

    const taxonomy = generateTaxonomyFile(manufacturer, product, variants);
    await importTaxonomy(taxonomy);
  };

  const copyCommand = async () => {
    await navigator.clipboard.writeText(generatedCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCommand = () => {
    const blob = new Blob([generatedCommand], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'taxonomy-command.lds.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Manufacturer Taxonomy Generator</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create AI commands for new manufacturer taxonomies or generate data directly
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('command')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                     ${activeTab === 'command' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <DocumentTextIcon className="h-4 w-4 inline mr-2" />
          Generate AI Command
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                     ${activeTab === 'generate' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <SparklesIcon className="h-4 w-4 inline mr-2" />
          Generate Data Directly
        </button>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit(activeTab === 'command' ? generateCommand : generateAndImport)}>
            {/* Manufacturer Section */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Manufacturer Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Company Name</label>
                  <input {...register('manufacturerName')} className="input-field" placeholder="e.g., ISOVER" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">MFG Code (3 letters)</label>
                    <input {...register('manufacturerCode')} className="input-field" placeholder="ISO" maxLength={3} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Region</label>
                    <input {...register('region')} className="input-field" placeholder="EU" maxLength={2} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Division Code</label>
                    <input {...register('division')} className="input-field" placeholder="FP" maxLength={3} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Family Code</label>
                    <input {...register('family')} className="input-field" placeholder="STL" maxLength={3} />
                  </div>
                </div>
              </div>
            </div>

            {/* Product Section */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Product Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Product System Name</label>
                  <input {...register('productSystem')} className="input-field" placeholder="e.g., FireProtect 150" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">System Code</label>
                    <input {...register('systemCode')} className="input-field" placeholder="150" maxLength={3} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Material Code</label>
                    <input {...register('material')} className="input-field" placeholder="SW" maxLength={2} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Category</label>
                  <select {...register('category')} className="input-field" onChange={(e) => {
                    setValue('category', e.target.value as ProductCategory);
                    setTimeout(applyTemplate, 0);
                  }}>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Certification Standard</label>
                  <input {...register('certification')} className="input-field" placeholder="EN 13381-4:2013" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Source Document</label>
                  <input {...register('sourceDocument')} className="input-field" placeholder="Technical Handbook" />
                </div>
              </div>
            </div>

            {/* Variants Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Variant Parameters
                </h3>
                <button type="button" onClick={applyTemplate} className="text-xs text-primary-600 hover:text-primary-700">
                  Apply Template
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ratings (comma-separated)</label>
                  <input {...register('ratings')} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Temperatures °C (comma-separated)</label>
                  <input {...register('temperatures')} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Thicknesses mm (comma-separated)</label>
                  <input {...register('thicknesses')} className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Exposures</label>
                    <input {...register('exposures')} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Fixings</label>
                    <input {...register('fixings')} className="input-field" />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full">
              {activeTab === 'command' ? 'Generate AI Command' : 'Generate & Import Data'}
            </button>
          </form>
        </div>

        {/* Output */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {activeTab === 'command' ? 'Generated AI Command' : 'Output'}
            </h3>
            {generatedCommand && (
              <div className="flex space-x-2">
                <button onClick={copyCommand} className="btn-secondary text-sm py-1 px-3">
                  {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
                </button>
                <button onClick={downloadCommand} className="btn-secondary text-sm py-1 px-3">
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {generatedCommand ? (
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-auto max-h-[600px] font-mono whitespace-pre-wrap">
              {generatedCommand}
            </pre>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Fill in the form and click generate</p>
                <p className="text-xs mt-1">
                  {activeTab === 'command'
                    ? 'The AI command will appear here'
                    : 'Data will be imported directly'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'command' && generatedCommand && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>How to use:</strong> Copy this command and paste it into any AI assistant
                (Claude, ChatGPT, etc.) along with your product documentation. The AI will extract
                all the data and return a complete LDS.json taxonomy file.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

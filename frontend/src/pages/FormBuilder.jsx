import React, { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formAPI } from '../utils/api'
import toast from 'react-hot-toast'
import { 
  Plus, 
  X, 
  GripVertical, 
  Type, 
  Mail, 
  AlignLeft, 
  List, 
  CheckSquare,
  Eye,
  Save,
  Trash2,
  Copy
} from 'lucide-react'

const SortableItem = ({ field, updateField, removeField }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 border border-gray-200 rounded-lg p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center space-x-2 text-gray-400 hover:text-gray-600 cursor-grab"
        >
          <GripVertical className="h-5 w-5" />
          <span className="text-sm font-medium text-gray-700">
            {field.type.charAt(0).toUpperCase() + field.type.slice(1)}
          </span>
        </div>
        <button
          onClick={() => removeField(field.id)}
          className="text-red-400 hover:text-red-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Label
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => updateField(field.id, { label: e.target.value })}
            className="input-field text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Placeholder
          </label>
          <input
            type="text"
            value={field.placeholder}
            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
            className="input-field text-sm"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => updateField(field.id, { required: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Required field</span>
        </label>
      </div>

      {field.type === 'select' && (
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options
          </label>
          {field.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={option.label}
                onChange={(e) => {
                  const newOptions = [...field.options]
                  newOptions[optionIndex] = {
                    ...option,
                    label: e.target.value,
                    value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                  }
                  updateField(field.id, { options: newOptions })
                }}
                placeholder="Option label"
                className="input-field text-sm flex-1"
              />
              <button
                onClick={() => {
                  const newOptions = field.options.filter((_, i) => i !== optionIndex)
                  updateField(field.id, { options: newOptions })
                }}
                className="text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newOptions = [...field.options, { value: '', label: '' }]
              updateField(field.id, { options: newOptions })
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Option
          </button>
        </div>
      )}
    </div>
  )
}

const FormBuilder = () => {
  const [forms, setForms] = useState([])
  const [templates, setTemplates] = useState([])
  const [currentForm, setCurrentForm] = useState(null)
  const [formFields, setFormFields] = useState([])
  const [formName, setFormName] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('modern')
  const [loading, setLoading] = useState(false)

  // Field types available for drag and drop
  const fieldTypes = [
    { id: 'text', icon: Type, label: 'Text Input', type: 'text' },
    { id: 'email', icon: Mail, label: 'Email Input', type: 'email' },
    { id: 'textarea', icon: AlignLeft, label: 'Textarea', type: 'textarea' },
    { id: 'select', icon: List, label: 'Dropdown', type: 'select' },
    { id: 'checkbox', icon: CheckSquare, label: 'Checkbox', type: 'checkbox' }
  ]

  const themes = [
    { id: 'modern', name: 'Ocean Breeze', class: 'theme-modern' },
    { id: 'dark', name: 'Midnight Galaxy', class: 'theme-dark' },
    { id: 'gradient', name: 'Sunrise Bloom', class: 'theme-gradient' },
    { id: 'neon', name: 'Electric Dreams', class: 'theme-neon' },
    { id: 'forest', name: 'Forest Mystique', class: 'theme-forest' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [formsResponse, templatesResponse] = await Promise.all([
        formAPI.getForms(),
        formAPI.getTemplates()
      ])
      setForms(formsResponse.data.forms)
      setTemplates(templatesResponse.data.templates)
    } catch (error) {
      toast.error('Failed to load forms')
    }
  }

  const addField = (fieldType) => {
    const newField = {
      id: `field_${Date.now()}`,
      type: fieldType.type,
      label: `${fieldType.label}`,
      placeholder: `Enter ${fieldType.label.toLowerCase()}`,
      required: false,
      options: fieldType.type === 'select' ? [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' }
      ] : undefined
    }
    setFormFields([...formFields, newField])
  }

  const removeField = (fieldId) => {
    setFormFields(formFields.filter(field => field.id !== fieldId))
  }

  const updateField = (fieldId, updates) => {
    setFormFields(formFields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ))
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = formFields.findIndex(field => field.id === active.id)
      const newIndex = formFields.findIndex(field => field.id === over.id)

      setFormFields(arrayMove(formFields, oldIndex, newIndex))
    }
  }

  const saveForm = async () => {
    if (!formName.trim()) {
      toast.error('Please enter a form name')
      return
    }

    if (formFields.length === 0) {
      toast.error('Please add at least one field')
      return
    }

    setLoading(true)
    try {
      const formData = {
        name: formName,
        fields: formFields
      }

      if (currentForm) {
        await formAPI.updateForm(currentForm.id, formData)
        toast.success('Form updated successfully')
      } else {
        await formAPI.createForm(formData)
        toast.success('Form created successfully')
      }

      loadData()
      resetForm()
    } catch (error) {
      toast.error('Failed to save form')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCurrentForm(null)
    setFormName('')
    setFormFields([])
    setShowPreview(false)
  }

  const loadForm = (form) => {
    setCurrentForm(form)
    setFormName(form.name)
    setFormFields(form.fields)
  }

  const applyTemplate = (template) => {
    setFormName(template.name)
    setFormFields(template.fields)
    setCurrentForm(null)
  }

  const deleteForm = async (formId) => {
    if (!confirm('Are you sure you want to delete this form?')) return

    try {
      await formAPI.deleteForm(formId)
      toast.success('Form deleted successfully')
      loadData()
      if (currentForm && currentForm.id === formId) {
        resetForm()
      }
    } catch (error) {
      toast.error('Failed to delete form')
    }
  }

  const generateFormPreviewHTML = () => {
    const themesCSS = `
/* Base form styling */
.form-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  transition: all 0.3s ease;
}

.form-card {
  max-width: 500px;
  width: 100%;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.form-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 8px;
  text-align: center;
}

.form-description {
  margin-bottom: 32px;
  text-align: center;
  opacity: 0.8;
}

.form-field {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 0.875rem;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 2px solid;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  transform: translateY(-1px);
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-checkbox input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.form-submit {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 24px;
}

.form-submit:hover {
  transform: translateY(-2px);
}

.form-submit:active {
  transform: translateY(0);
}

.form-error {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 4px;
}

.required {
  color: #ef4444;
}

/* Ocean Breeze Theme */
.theme-modern {
  --primary: #0891b2;
  --primary-hover: #0e7490;
  --background: #ffffff;
  --surface: #f0f9ff;
  --text: #0f172a;
  --text-secondary: #475569;
  --border: #cbd5e1;
  --border-focus: #0891b2;
  --shadow: rgba(8, 145, 178, 0.1);
  --gradient-start: #f0f9ff;
  --gradient-end: #e0f2fe;
}

.theme-modern .form-container {
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 50%, #bae6fd 100%);
  color: var(--text);
  position: relative;
}

.theme-modern .form-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="waves" x="0" y="0" width="100" height="20" patternUnits="userSpaceOnUse"><path d="M0 10 Q25 0 50 10 T100 10 V20 H0 Z" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23waves)"/></svg>') repeat;
  opacity: 0.3;
  pointer-events: none;
}

.theme-modern .form-card {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(8, 145, 178, 0.2);
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 1;
}

.theme-modern .form-title {
  color: var(--text);
  background: linear-gradient(135deg, #0891b2, #0284c7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
}

.theme-modern .form-description {
  color: var(--text-secondary);
}

.theme-modern .form-label {
  color: var(--text);
  font-weight: 600;
}

.theme-modern .form-input,
.theme-modern .form-select,
.theme-modern .form-textarea {
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid var(--border);
  color: var(--text);
  backdrop-filter: blur(5px);
}

.theme-modern .form-input:focus,
.theme-modern .form-select:focus,
.theme-modern .form-textarea:focus {
  border-color: var(--border-focus);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 4px rgba(8, 145, 178, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.theme-modern .form-submit {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  font-weight: 600;
  border: none;
  box-shadow: 0 4px 14px 0 rgba(8, 145, 178, 0.39);
}

.theme-modern .form-submit:hover {
  background: linear-gradient(135deg, var(--primary-hover), #0369a1);
  box-shadow: 0 8px 25px rgba(8, 145, 178, 0.5);
  transform: translateY(-2px);
}

/* Midnight Galaxy Theme */
.theme-dark {
  --primary: #a855f7;
  --primary-hover: #9333ea;
  --background: #0f0f23;
  --surface: #1a1a2e;
  --text: #f8fafc;
  --text-secondary: #cbd5e1;
  --border: #334155;
  --border-focus: #a855f7;
  --shadow: rgba(0, 0, 0, 0.8);
  --accent: #fbbf24;
}

.theme-dark .form-container {
  background: radial-gradient(ellipse at top, #1e1b4b 0%, #0f0f23 50%, #000000 100%);
  color: var(--text);
  position: relative;
  overflow: hidden;
}

.theme-dark .form-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%);
  animation: cosmic-drift 20s ease-in-out infinite alternate;
}

@keyframes cosmic-drift {
  0% { transform: translateX(-10px) translateY(-10px); }
  100% { transform: translateX(10px) translateY(10px); }
}

.theme-dark .form-card {
  background: rgba(15, 15, 35, 0.9);
  border: 1px solid rgba(168, 85, 247, 0.3);
  backdrop-filter: blur(15px);
  box-shadow: 
    0 0 40px rgba(168, 85, 247, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
}

.theme-dark .form-title {
  background: linear-gradient(135deg, #a855f7, #fbbf24, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
  text-shadow: 0 0 30px rgba(168, 85, 247, 0.5);
}

.theme-dark .form-description {
  color: var(--text-secondary);
}

.theme-dark .form-label {
  color: var(--text);
  font-weight: 600;
}

.theme-dark .form-input,
.theme-dark .form-select,
.theme-dark .form-textarea {
  background: rgba(15, 15, 35, 0.8);
  border: 2px solid var(--border);
  color: var(--text);
  backdrop-filter: blur(10px);
}

.theme-dark .form-input:focus,
.theme-dark .form-select:focus,
.theme-dark .form-textarea:focus {
  border-color: var(--border-focus);
  background: rgba(15, 15, 35, 0.95);
  box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.2), 0 0 20px rgba(168, 85, 247, 0.3);
}

.theme-dark .form-submit {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: var(--background);
  font-weight: 700;
  border: none;
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
  text-shadow: none;
}

.theme-dark .form-submit:hover {
  background: linear-gradient(135deg, var(--primary-hover), #f59e0b);
  box-shadow: 0 0 30px rgba(168, 85, 247, 0.6), 0 8px 25px rgba(0, 0, 0, 0.3);
  transform: translateY(-3px);
}

/* Other themes simplified for space */
.theme-gradient .form-container {
  background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 25%, #fbbf24 50%, #f59e0b 75%, #d97706 100%);
}

.theme-gradient .form-title {
  background: linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.theme-neon .form-container {
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
  color: #ffffff;
}

.theme-neon .form-title {
  background: linear-gradient(45deg, #00f5ff, #ff0080, #39ff14);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.theme-forest .form-container {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 30%, #bbf7d0 60%, #86efac 100%);
}

.theme-forest .form-title {
  background: linear-gradient(135deg, #059669, #8b4513, #dc2626);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
    `

    const formFieldsHTML = formFields.map(field => {
      const required = field.required ? 'required' : ''
      const requiredStar = field.required ? '<span class="required">*</span>' : ''
      
      switch (field.type) {
        case 'text':
        case 'email':
          return `
            <div class="form-field">
              <label class="form-label" for="${field.id}">
                ${field.label}${requiredStar}
              </label>
              <input
                type="${field.type}"
                id="${field.id}"
                name="${field.id}"
                class="form-input"
                placeholder="${field.placeholder || ''}"
                ${required}
              />
            </div>
          `
          
        case 'textarea':
          return `
            <div class="form-field">
              <label class="form-label" for="${field.id}">
                ${field.label}${requiredStar}
              </label>
              <textarea
                id="${field.id}"
                name="${field.id}"
                class="form-textarea"
                placeholder="${field.placeholder || ''}"
                ${required}
              ></textarea>
            </div>
          `
          
        case 'select': {
          const options = field.options?.map(option => 
            `<option value="${option.value}">${option.label}</option>`
          ).join('') || ''
          return `
            <div class="form-field">
              <label class="form-label" for="${field.id}">
                ${field.label}${requiredStar}
              </label>
              <select
                id="${field.id}"
                name="${field.id}"
                class="form-select"
                ${required}
              >
                <option value="">Select an option</option>
                ${options}
              </select>
            </div>
          `
        }
          
        case 'checkbox':
          return `
            <div class="form-field">
              <div class="form-checkbox">
                <input
                  type="checkbox"
                  id="${field.id}"
                  name="${field.id}"
                  value="true"
                  ${required}
                />
                <label class="form-label" for="${field.id}">
                  ${field.label}${requiredStar}
                </label>
              </div>
            </div>
          `
          
        default:
          return ''
      }
    }).join('')

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${formName || 'Preview Form'}</title>
        <style>${themesCSS}</style>
      </head>
      <body class="theme-${selectedTheme}">
        <div class="form-container">
          <div class="form-card">
            <h1 class="form-title">${formName || 'Complete the form to continue'}</h1>
            ${formFields.length === 0 ? `
              <div style="text-align: center; padding: 48px 0; color: #9ca3af;">
                <p>Add some fields to see the preview</p>
              </div>
            ` : `
              <form>
                ${formFieldsHTML}
                <button type="button" class="form-submit">
                  Continue to Destination
                </button>
              </form>
            `}
          </div>
        </div>
      </body>
      </html>
    `
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Form Builder</h1>
          <p className="text-gray-600">Create and manage custom forms for lead generation</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </button>
          <button
            onClick={saveForm}
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Saving...' : 'Save Form'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Field Types Sidebar */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Field Types</h3>
            <div className="space-y-2">
              {fieldTypes.map((fieldType) => {
                const Icon = fieldType.icon
                return (
                  <button
                    key={fieldType.id}
                    onClick={() => addField(fieldType)}
                    className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Icon className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {fieldType.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Templates */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Templates</h3>
              <div className="space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-700">
                      {template.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {template.fields.length} fields
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form Builder */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter form name"
                className="input-field"
              />
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Fields</h3>
              
              {formFields.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <Type className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    Click on field types to add them to your form
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={formFields.map(field => field.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {formFields.map((field) => (
                        <SortableItem
                          key={field.id}
                          field={field}
                          updateField={updateField}
                          removeField={removeField}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>

        {/* Forms List */}
        <div className="lg:col-span-1">
          {!showPreview ? (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Forms</h3>
              <div className="space-y-2">
                {forms.map((form) => (
                  <div
                    key={form.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{form.name}</h4>
                        <p className="text-xs text-gray-500">{form.fields.length} fields</p>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => loadForm(form)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteForm(form.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Full-Screen Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
          <div className="bg-white rounded-lg max-w-7xl w-full h-[98vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <h3 className="text-xl font-semibold text-gray-900">Form Preview</h3>
                <select
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white"
                >
                  {themes.map(theme => (
                    <option key={theme.id} value={theme.id}>{theme.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-hidden">
              <iframe
                srcDoc={generateFormPreviewHTML()}
                className="w-full h-full border-0"
                title="Form Preview"
                sandbox="allow-same-origin"
              />
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Theme: <span className="font-medium">{themes.find(t => t.id === selectedTheme)?.name}</span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="btn-secondary"
                >
                  Close Preview
                </button>
                <button
                  onClick={saveForm}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Saving...' : 'Save Form'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FormBuilder
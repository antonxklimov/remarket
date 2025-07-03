import React, { useState, useEffect, useRef } from 'react';
import { defaultSections } from '../sectionsData';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, ContentState, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

const API_BASE_URL = '/api';

export default function AdminPanel() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Снимаем любые ограничения overflow для body и html
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    const prevTitle = document.title;
    document.title = 'RE→MARKET / ADMIN';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.title = prevTitle || 'RE→MARKET 2025';
    };
  }, []);

  // Загрузка данных с сервера
  useEffect(() => {
    async function loadSections() {
      try {
        const response = await fetch(`${API_BASE_URL}/data`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Добавляем editorState для каждой секции
        const sectionsWithEditor = data.map(s => {
          let editorState;
          if (s.text) {
            try {
              const contentBlock = htmlToDraft(s.text);
              if (contentBlock && contentBlock.contentBlocks) {
                const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
                editorState = EditorState.createWithContent(contentState);
              } else {
                editorState = EditorState.createEmpty();
              }
            } catch (e) {
              editorState = EditorState.createEmpty();
            }
          } else {
            editorState = EditorState.createEmpty();
          }
          return { 
            ...s,
            galleryEnabled: s.galleryEnabled ?? false, 
            gallery: s.gallery ?? [], 
            editorState 
          };
        });
        
        setSections(sectionsWithEditor);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        alert('Ошибка загрузки данных с сервера. Используются данные по умолчанию.');
        
        // Используем данные по умолчанию в случае ошибки
        const sectionsWithEditor = defaultSections.map(s => {
          let editorState;
          if (s.text) {
            try {
              const contentBlock = htmlToDraft(s.text);
              if (contentBlock && contentBlock.contentBlocks) {
                const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
                editorState = EditorState.createWithContent(contentState);
              } else {
                editorState = EditorState.createEmpty();
              }
            } catch (e) {
              editorState = EditorState.createEmpty();
            }
          } else {
            editorState = EditorState.createEmpty();
          }
          return { 
            ...s,
            galleryEnabled: s.galleryEnabled ?? false, 
            gallery: s.gallery ?? [], 
            editorState 
          };
        });
        setSections(sectionsWithEditor);
      } finally {
        setLoading(false);
      }
    }
    
    loadSections();
  }, []);

  function handleChange(idx, field, value) {
    setSections(sections => sections.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  function handleEditorChange(idx, editorState) {
    const html = draftToHtml(convertToRaw(editorState.getCurrentContent()));
    setSections(sections => sections.map((s, i) => i === idx ? { ...s, editorState, text: html } : s));
  }

  async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
      alert('Ошибка загрузки изображения. Попробуйте еще раз.');
      return null;
    }
  }

  async function handleImage(idx, file) {
    if (!file) return;
    
    // Показываем индикатор загрузки
    handleChange(idx, 'image', 'loading...');
    
    // Загружаем изображение на сервер
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      handleChange(idx, 'image', imageUrl);
    } else {
      handleChange(idx, 'image', '');
    }
  }

  async function handleGalleryImage(idx, file) {
    if (!file) return;
    
    // Показываем индикатор загрузки
    setSections(sections => sections.map((s, i) => {
      if (i !== idx) return s;
      const gallery = Array.isArray(s.gallery) ? s.gallery.slice(0, 3) : [];
      if (gallery.length < 3) gallery.push('loading...');
      return { ...s, gallery };
    }));
    
    // Загружаем изображение на сервер
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setSections(sections => sections.map((s, i) => {
        if (i !== idx) return s;
        const gallery = Array.isArray(s.gallery) ? s.gallery.slice() : [];
        const loadingIndex = gallery.indexOf('loading...');
        if (loadingIndex !== -1) {
          gallery[loadingIndex] = imageUrl;
        }
        return { ...s, gallery };
      }));
    } else {
      // Удаляем индикатор загрузки если загрузка не удалась
      setSections(sections => sections.map((s, i) => {
        if (i !== idx) return s;
        const gallery = Array.isArray(s.gallery) ? s.gallery.filter(img => img !== 'loading...') : [];
        return { ...s, gallery };
      }));
    }
  }

  function handleDeleteGalleryImage(idx, imgIdx) {
    setSections(sections => sections.map((s, i) => {
      if (i !== idx) return s;
      const gallery = Array.isArray(s.gallery) ? s.gallery.filter((_, j) => j !== imgIdx) : [];
      return { ...s, gallery };
    }));
  }

  function handleAddSection() {
    setSections(sections => [
      ...sections,
      {
        id: `section-${Date.now()}`,
        title: 'Новая секция',
        text: '',
        image: '',
        galleryEnabled: false,
        gallery: [],
        editorState: EditorState.createEmpty(),
      },
    ]);
  }

  function handleDeleteSection(idx) {
    setSections(sections => sections.filter((_, i) => i !== idx));
  }

  function handleToggleHidden(idx) {
    setSections(sections => sections.map((s, i) => i === idx ? { ...s, hidden: !s.hidden } : s));
  }

  function handleMoveUp(idx) {
    if (idx === 0) return; // Уже наверху
    setSections(sections => {
      const newSections = [...sections];
      [newSections[idx - 1], newSections[idx]] = [newSections[idx], newSections[idx - 1]];
      return newSections;
    });
  }

  function handleMoveDown(idx) {
    if (idx === sections.length - 1) return; // Уже внизу
    setSections(sections => {
      const newSections = [...sections];
      [newSections[idx], newSections[idx + 1]] = [newSections[idx + 1], newSections[idx]];
      return newSections;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const sectionsData = sections.map(({editorState, ...rest}) => rest);
      
      const response = await fetch(`${API_BASE_URL}/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sections: sectionsData }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      alert('Данные успешно сохранены на сервере!');
      
      // Также сохраняем в localStorage как бэкап
      localStorage.setItem('sections', JSON.stringify(sectionsData));
      
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения данных на сервере. Попробуйте еще раз.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontFamily: 'Helvetica Neue',
        color: '#111',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>Загрузка данных...</div>
          <div style={{ fontSize: 16, color: '#666' }}>Подключение к серверу</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: '#fff',
      overflowY: 'auto',
      fontSize: 18,
      fontFamily: 'Helvetica Neue',
      color: '#111',
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
    }}>
      <div style={{ maxWidth: 800, width: '100%', margin: '40px auto', background: '#f8f9fa', borderRadius: 16, padding: 40, fontFamily: 'Helvetica Neue', color: '#000' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 32, marginBottom: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h1 style={{ fontSize: 36, marginBottom: 8, fontWeight: 700 }}>Админка RE→MARKET</h1>
          <p style={{ fontSize: 16, color: '#666', margin: 0 }}>Управление контентом и секциями сайта</p>
        </div>
        {sections.map((s, i) => (
          <div key={s.id} style={{ 
            background: '#fff', 
            borderRadius: 12, 
            padding: 32, 
            marginBottom: 24, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e9ecef'
          }}>
            {/* Заголовок секции */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: '1px solid #f1f3f4'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ 
                  background: '#000', 
                  color: '#fff', 
                  borderRadius: '50%', 
                  width: 32, 
                  height: 32, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: 14,
                  fontWeight: 600
                }}>
                  {i + 1}
                </span>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
                  {s.title || 'Новая секция'}
                </h3>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button 
                  onClick={() => handleMoveUp(i)} 
                  disabled={i === 0}
                  style={{ 
                    background: i === 0 ? '#f8f9fa' : '#fff', 
                    color: i === 0 ? '#adb5bd' : '#000', 
                    border: '1px solid #e9ecef', 
                    borderRadius: 8, 
                    padding: '8px 12px', 
                    fontSize: 16, 
                    cursor: i === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title="Переместить вверх"
                >
                  ↑
                </button>
                <button 
                  onClick={() => handleMoveDown(i)} 
                  disabled={i === sections.length - 1}
                  style={{ 
                    background: i === sections.length - 1 ? '#f8f9fa' : '#fff', 
                    color: i === sections.length - 1 ? '#adb5bd' : '#000', 
                    border: '1px solid #e9ecef', 
                    borderRadius: 8, 
                    padding: '8px 12px', 
                    fontSize: 16, 
                    cursor: i === sections.length - 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title="Переместить вниз"
                >
                  ↓
                </button>
                <button 
                  onClick={() => handleDeleteSection(i)} 
                  style={{ 
                    background: '#fff', 
                    color: '#dc3545', 
                    border: '1px solid #dc3545', 
                    borderRadius: 8, 
                    padding: '8px 16px', 
                    fontSize: 14, 
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Удалить
                </button>
              </div>
            </div>
            {/* Блок настроек секции */}
            <div style={{ 
              background: '#f8f9fa', 
              borderRadius: 8, 
              padding: 24, 
              marginBottom: 24 
            }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>Настройки секции</h4>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 8 }}>
                  Название секции
                </label>
                <input 
                  value={s.title} 
                  onChange={e => handleChange(i, 'title', e.target.value)} 
                  style={{ 
                    width: '100%', 
                    fontSize: 16, 
                    padding: '12px 16px', 
                    borderRadius: 8, 
                    border: '1px solid #e9ecef', 
                    background: '#fff', 
                    color: '#000', 
                    fontFamily: 'Helvetica Neue',
                    transition: 'border-color 0.2s'
                  }} 
                  placeholder="Введите название секции"
                />
              </div>
              
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  fontSize: 14, 
                  cursor: 'pointer', 
                  userSelect: 'none' 
                }}>
                  <input 
                    type="checkbox" 
                    checked={!!s.hidden} 
                    onChange={() => handleToggleHidden(i)} 
                    style={{ 
                      width: 16, 
                      height: 16, 
                      accentColor: '#000' 
                    }} 
                  />
                  Скрыть секцию
                </label>
              </div>
            </div>
            
            {/* Блок редактирования контента */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 8 }}>
                Текст секции
              </label>
              <div style={{ border: '1px solid #e9ecef', borderRadius: 8, background: '#fff' }}>
                <Editor
                  editorState={s.editorState}
                  onEditorStateChange={editorState => handleEditorChange(i, editorState)}
                  toolbar={{ options: ['inline', 'list', 'link', 'history'], inline: { options: ['bold', 'italic', 'underline'] } }}
                  editorStyle={{ minHeight: 80, padding: 8, fontSize: 16, background: '#fff' }}
                />
              </div>
            </div>
            {/* Блок изображений */}
            <div style={{ 
              background: '#f8f9fa', 
              borderRadius: 8, 
              padding: 24 
            }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>Изображения</h4>
              
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                fontSize: 14, 
                cursor: 'pointer', 
                userSelect: 'none',
                marginBottom: 20
              }}>
                <input 
                  type="checkbox" 
                  checked={!!s.galleryEnabled} 
                  onChange={e => handleChange(i, 'galleryEnabled', e.target.checked)} 
                  style={{ 
                    width: 16, 
                    height: 16, 
                    accentColor: '#000' 
                  }} 
                />
                Включить галерею (до 3 фото)
              </label>
              
              {s.galleryEnabled ? (
                <div>
                  <GalleryInput idx={i} gallery={s.gallery} onAdd={handleGalleryImage} disabled={s.gallery && s.gallery.length >= 3} />
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {s.gallery && s.gallery.map((img, imgIdx) => (
                      <div key={imgIdx} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
                        {img === 'loading...' ? (
                          <div style={{ 
                            width: 120, 
                            height: 80, 
                            borderRadius: 8, 
                            border: '2px dashed #adb5bd', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: 14,
                            color: '#6c757d',
                            background: '#fff'
                          }}>
                            Загрузка...
                          </div>
                        ) : (
                          <img 
                            src={img.startsWith('/') ? img : img} 
                            alt="gallery" 
                            style={{ 
                              width: 120, 
                              height: 80, 
                              objectFit: 'cover', 
                              borderRadius: 8, 
                              border: '1px solid #e9ecef' 
                            }} 
                          />
                        )}
                        {img !== 'loading...' && (
                          <button 
                            onClick={() => handleDeleteGalleryImage(i, imgIdx)} 
                            style={{ 
                              position: 'absolute', 
                              top: 4, 
                              right: 4, 
                              background: '#fff', 
                              color: '#dc3545', 
                              border: '1px solid #dc3545', 
                              borderRadius: '50%', 
                              width: 24, 
                              height: 24, 
                              fontSize: 14, 
                              cursor: 'pointer', 
                              lineHeight: 1, 
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 8 }}>
                    Одно фото
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => handleImage(i, e.target.files[0])} 
                    style={{ 
                      display: 'block', 
                      marginBottom: 16,
                      padding: '8px 12px',
                      border: '1px solid #e9ecef',
                      borderRadius: 8,
                      background: '#fff',
                      fontSize: 14
                    }} 
                  />
                  {s.image && (
                    s.image === 'loading...' ? (
                      <div style={{ 
                        width: 180, 
                        height: 120, 
                        borderRadius: 8, 
                        border: '2px dashed #adb5bd', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: 16,
                        color: '#6c757d',
                        background: '#fff'
                      }}>
                        Загрузка изображения...
                      </div>
                    ) : (
                      <img 
                        src={s.image.startsWith('/') ? s.image : s.image} 
                        alt="preview" 
                        style={{ 
                          width: 180, 
                          height: 120, 
                          objectFit: 'cover', 
                          borderRadius: 8, 
                          border: '1px solid #e9ecef' 
                        }} 
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div style={{ 
          background: '#fff', 
          borderRadius: 12, 
          padding: 32, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecef',
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <button 
            onClick={handleAddSection} 
            style={{ 
              background: '#fff', 
              color: '#000', 
              fontSize: 16, 
              padding: '14px 32px', 
              border: '1px solid #000', 
              borderRadius: 8, 
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            + Добавить секцию
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            style={{ 
              background: saving ? '#6c757d' : '#000', 
              color: '#fff', 
              fontSize: 16, 
              padding: '14px 32px', 
              border: 'none', 
              borderRadius: 8, 
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </div>
    </div>
  );
}

function GalleryInput({ idx, gallery, onAdd, disabled }) {
  const inputRef = useRef();
  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      disabled={disabled}
      onChange={e => {
        if (e.target.files[0]) {
          onAdd(idx, e.target.files[0]);
          inputRef.current.value = '';
        }
      }}
      style={{ 
        display: 'block', 
        marginBottom: 16,
        padding: '8px 12px',
        border: '1px solid #e9ecef',
        borderRadius: 8,
        background: disabled ? '#f8f9fa' : '#fff',
        fontSize: 14,
        color: disabled ? '#6c757d' : '#000',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    />
  );
} 
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
            largeTitle: s.largeTitle ?? false, 
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
            largeTitle: s.largeTitle ?? false, 
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
        largeTitle: false,
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
      <div style={{ maxWidth: 600, width: '100%', margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: 32, fontFamily: 'Helvetica Neue', color: '#111' }}>
        <h1 style={{ fontSize: 32, marginBottom: 32 }}>Редактирование секций</h1>
        {sections.map((s, i) => (
          <div key={s.id} style={{ marginBottom: 32, borderBottom: '1px solid #eee', paddingBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontWeight: 600, fontSize: 18, flex: 1 }}>Название секции</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Кнопки перемещения */}
                <button 
                  onClick={() => handleMoveUp(i)} 
                  disabled={i === 0}
                  style={{ 
                    background: '#fff', 
                    color: i === 0 ? '#ccc' : '#222', 
                    border: '1px solid #ccc', 
                    borderRadius: 6, 
                    padding: '4px 8px', 
                    fontSize: 14, 
                    cursor: i === 0 ? 'not-allowed' : 'pointer' 
                  }}
                  title="Переместить вверх"
                >
                  ↑
                </button>
                <button 
                  onClick={() => handleMoveDown(i)} 
                  disabled={i === sections.length - 1}
                  style={{ 
                    background: '#fff', 
                    color: i === sections.length - 1 ? '#ccc' : '#222', 
                    border: '1px solid #ccc', 
                    borderRadius: 6, 
                    padding: '4px 8px', 
                    fontSize: 14, 
                    cursor: i === sections.length - 1 ? 'not-allowed' : 'pointer' 
                  }}
                  title="Переместить вниз"
                >
                  ↓
                </button>
                <label style={{ fontSize: 15, display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
                  <input type="checkbox" checked={!!s.hidden} onChange={() => handleToggleHidden(i)} style={{ marginRight: 6 }} />
                  Скрыть секцию
                </label>
                <button onClick={() => handleDeleteSection(i)} style={{ background: '#fff', color: '#d00', border: '1px solid #d00', borderRadius: 6, padding: '4px 12px', fontSize: 14, cursor: 'pointer' }}>Удалить</button>
              </div>
            </div>
            <input value={s.title} onChange={e => handleChange(i, 'title', e.target.value)} style={{ width: '100%', fontSize: 18, margin: '0 0 8px 0', padding: 8, borderRadius: 6, border: '1px solid #ccc', background: '#fff', color: '#111', fontFamily: 'Helvetica Neue' }} />
            <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px 0' }}>
              <input type="checkbox" checked={!!s.largeTitle} onChange={e => handleChange(i, 'largeTitle', e.target.checked)} style={{ marginRight: 6 }} />
              Большой заголовок (11rem)
            </label>
            <label style={{ fontWeight: 600 }}>Текст</label>
            <div style={{ border: 'none', borderRadius: 6, margin: '8px 0 16px 0', background: '#fff' }}>
              <Editor
                editorState={s.editorState}
                onEditorStateChange={editorState => handleEditorChange(i, editorState)}
                toolbar={{ options: ['inline', 'list', 'link', 'history'], inline: { options: ['bold', 'italic', 'underline'] } }}
                editorStyle={{ minHeight: 80, padding: 8, fontSize: 16, background: '#fff' }}
              />
            </div>
            <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!s.galleryEnabled} onChange={e => handleChange(i, 'galleryEnabled', e.target.checked)} style={{ marginRight: 6 }} />
              Включить галерею (до 3 фото)
            </label>
            {s.galleryEnabled ? (
              <div style={{ margin: '8px 0 16px 0' }}>
                <GalleryInput idx={i} gallery={s.gallery} onAdd={handleGalleryImage} disabled={s.gallery && s.gallery.length >= 3} />
                <div style={{ display: 'flex', gap: 12 }}>
                  {s.gallery && s.gallery.map((img, imgIdx) => (
                    <div key={imgIdx} style={{ position: 'relative' }}>
                      {img === 'loading...' ? (
                        <div style={{ 
                          width: 120, 
                          height: 80, 
                          borderRadius: 8, 
                          border: '2px dashed #ccc', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: 14,
                          color: '#666'
                        }}>
                          Загрузка...
                        </div>
                      ) : (
                        <img src={img.startsWith('/') ? img : img} alt="gallery" style={{ maxWidth: 120, maxHeight: 80, borderRadius: 8, marginBottom: 4 }} />
                      )}
                      {img !== 'loading...' && (
                        <button onClick={() => handleDeleteGalleryImage(i, imgIdx)} style={{ position: 'absolute', top: 0, right: 0, background: '#fff', color: '#d00', border: '1px solid #d00', borderRadius: '50%', width: 22, height: 22, fontSize: 14, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <label style={{ fontWeight: 600 }}>Фото</label>
                <input type="file" accept="image/*" onChange={e => handleImage(i, e.target.files[0])} style={{ display: 'block', margin: '8px 0 16px 0' }} />
                {s.image && (
                  s.image === 'loading...' ? (
                    <div style={{ 
                      width: 180, 
                      height: 120, 
                      borderRadius: 8, 
                      border: '2px dashed #ccc', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: 16,
                      color: '#666',
                      marginBottom: 8
                    }}>
                      Загрузка изображения...
                    </div>
                  ) : (
                    <img src={s.image.startsWith('/') ? s.image : s.image} alt="preview" style={{ maxWidth: 180, maxHeight: 120, borderRadius: 8, marginBottom: 8 }} />
                  )
                )}
              </>
            )}
          </div>
        ))}
        <button onClick={handleAddSection} style={{ background: '#fff', color: '#222', fontSize: 18, padding: '12px 32px', border: '1px solid #222', borderRadius: 8, cursor: 'pointer', marginRight: 16 }}>Добавить секцию</button>
        <button 
          onClick={handleSave} 
          disabled={saving}
          style={{ 
            background: saving ? '#ccc' : '#222', 
            color: '#fff', 
            fontSize: 18, 
            padding: '12px 32px', 
            border: 'none', 
            borderRadius: 8, 
            cursor: saving ? 'not-allowed' : 'pointer' 
          }}
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
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
      style={{ display: 'block', marginBottom: 8 }}
    />
  );
} 
import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [content, setContent] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [currentStyle, setCurrentStyle] = useState({
    fontSize: '16px',
    color: '#000',
    textAlign: 'left',
    width: '550px',
    height: 'auto',
    margin:'0 auto',
    backgroundColor: 'none',
  });
  const [containerBgColor, setContainerBgColor] = useState('#ccc');

  const addHeading = () => {
    setContent([...content, { type: 'heading', text: 'Heading Text', style: { ...currentStyle, backgroundColor: '#f0f0f0' } }]);
  };

  const addText = () => {
    setContent([...content, { type: 'text', text: 'Text Content', style: { ...currentStyle, backgroundColor: '#ffffff' } }]);
  };

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
          const uploadResponse = await axios.post('http://localhost:5000/upload', formData);
          setContent([
            ...content,
            {
              type: 'image',
              src: uploadResponse.data.url, // URL from Cloudinary
              alt: 'Uploaded Image',
              style: currentStyle,
            },
          ]);
        } catch (error) {
          console.error('Image upload failed', error);
          alert('Failed to upload image.');
        }
      }
    };
    input.click();
  };

  const handleEdit = (index, newValue) => {
    const updatedContent = [...content];
    updatedContent[index].text = newValue;
    if (updatedContent[index].type === 'heading' && newValue !== 'Heading Text') {
      updatedContent[index].style.backgroundColor = 'none';
    }
    setContent(updatedContent);
  };

const handleDelete = (index) => {
  const updatedContent = content.filter((_, i) => i !== index);
  setContent(updatedContent);
  if (selectedIndex >= updatedContent.length) {
    setSelectedIndex(updatedContent.length - 1); // Adjust index
  }
};

  const handleStyleChange = (key, value) => {
    if (selectedIndex !== null) {
      const updatedContent = [...content];
      updatedContent[selectedIndex].style = { ...updatedContent[selectedIndex].style, [key]: value };
      setContent(updatedContent);
    }
    setCurrentStyle({ ...currentStyle, [key]: value });
  };

  const handleBgColorChange = (color) => {
    if (selectedIndex !== null) {
      const updatedContent = [...content];
      updatedContent[selectedIndex] = {
        ...updatedContent[selectedIndex],
        style: { ...updatedContent[selectedIndex].style, backgroundColor: color },
      };
      setContent(updatedContent);
    }
  };

  const handleContainerBgColorChange = (color) => {
    setContainerBgColor(color);
  };

  const saveToDatabase = async () => {
    const processedContent = await Promise.all(
      content.map(async (item, index) => {
        if (item.type === 'image' && item.src) {
          const response = await axios.get(item.src, { responseType: 'blob' });
          const file = new File([response.data], `image-${index}.jpg`, { type: response.data.type });
          const formData = new FormData();
          formData.append('file', file);

          try {
            const uploadResponse = await axios.post('http://localhost:5000/upload', formData);
            return { ...item, src: uploadResponse.data.url }; // Assuming upload returns a URL
          } catch (error) {
            console.error('Image upload failed', error);
            return item;
          }
        }
        return item;
      })
    );

    try {
      const saveResponse = await axios.post('http://localhost:5000/save', {
        content: processedContent,
      });

      if (saveResponse.status === 200) {
        alert('Content saved successfully!');
      } else {
        console.error('Failed to save content:', saveResponse);
      }
    } catch (error) {
      console.error('Error saving content to the database', error);
    }
  };

  const sendEmail = async () => {
    try {
      const sendResponse = await axios.post('http://localhost:5000/send-email', {
        content,
      });

      if (sendResponse.status === 200) {
        alert('Email sent successfully!');
      } else {
        console.error('Failed to send email:', sendResponse);
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  return (
    <div className="editor-container">
      <div className="left-editor">
        <div className='edit-btn'>
        <button onClick={addHeading} className="editor-button">Add Heading</button>
        <button onClick={addText} className="editor-button">Add Text</button>
        <button onClick={addImage} className="editor-button">Upload Image</button>
        </div>

        {selectedIndex !== null && (
        <div className="style-options">
  {content[selectedIndex] ? (
    content[selectedIndex].type === 'image' ? (
      <div className='edit-items'>
      <>
        <label>Width:</label>
        <input
          type="number"
          value={currentStyle.width.replace('px', '')}
          onChange={(e) => handleStyleChange('width', e.target.value + 'px')}
        />
        <label>Height:</label>
        <input
          type="number"
          value={currentStyle.height.replace('px', '')}
          onChange={(e) => handleStyleChange('height', e.target.value + 'px')}
        />
        <label>Image Align:</label>
        <select
          value={currentStyle.textAlign}
          onChange={(e) => handleStyleChange('textAlign', e.target.value)}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </>
      </div>
    ) : (
      <div className='edit-items'>
      <>
        <label>Font Size:</label>
        <input
          type="number"
          value={currentStyle.fontSize.replace('px', '')}
          onChange={(e) => handleStyleChange('fontSize', e.target.value + 'px')}
        />
        <label>Text Color:</label>
        <input
          type="color"
          value={currentStyle.color}
          onChange={(e) => handleStyleChange('color', e.target.value)}
        />
        <label>Text Align:</label>
        <select
          value={currentStyle.textAlign}
          onChange={(e) => handleStyleChange('textAlign', e.target.value)}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </>
      </div>
    )
  ) : (
    <p>Please select a valid item.</p>
  )}
</div>

        )}

      {selectedIndex !== null && content[selectedIndex]?.style && (
  <div>
    <label>Background Color (for selected item):</label>
    <input
      type="color"
      onChange={(e) => handleBgColorChange(e.target.value)}
      value={content[selectedIndex]?.style?.backgroundColor || '#ffffff'} // Fallback to white
    />
  </div>
)}


        <div>
          <label>Preview Container Background Color:</label>
          <input
            type="color"
            value={containerBgColor}
            onChange={(e) => handleContainerBgColorChange(e.target.value)}
          />
        </div>

        <div>
          <button className="save-button" onClick={saveToDatabase}>Save</button>
          <button className="send-email-button" onClick={sendEmail}>Send Email</button>
        </div>
      </div>

      <div className="right-preview">
         <div div className = 'preview-template' style = {{backgroundColor: containerBgColor}}>
        {content.map((item, index) => (
         
          <div
            key={index}
            className="content-item"
            style={item.style}
            onClick={() => setSelectedIndex(index)}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', index)}
            onDragOver={(e) => e.preventDefault()}
                     onDrop={(e) => {
              const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
              const droppedIndex = index;
              if (draggedIndex !== droppedIndex) {
                const updatedContent = [...content];
                const [draggedItem] = updatedContent.splice(draggedIndex, 1);
                updatedContent.splice(droppedIndex, 0, draggedItem);
                setContent(updatedContent);
              }
            }}
          >
            {item.type === 'heading' && (
              <h1
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleEdit(index, e.target.textContent)}
              >
                {item.text}
              </h1>
            )}
            {item.type === 'text' && (
              <p
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleEdit(index, e.target.textContent)}
              >
                {item.text}
              </p>
            )}
            {item.type === 'image' && (
              <img
                src={item.src}
                alt={item.alt}
                style={{ width: item.style.width, height: item.style.height }}
              />
            )}
            <button
              className="delete-button"
              onClick={() => handleDelete(index)}>
              Delete
            </button>
          </div>
         
        ))}
      </div>
    </div>
     </div>
  );
}

export default App;

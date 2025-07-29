import React from 'react';
import { Card, List, Button, Tag, Space } from 'antd';
import { PlayCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const ModuleView = ({ moduleId, content, progress }) => {
  const moduleIcons = {
    bureautique: { icon: '📊', color: '#1890ff' },
    informatique: { icon: '💻', color: '#52c41a' },
    programmation: { icon: '👨‍💻', color: '#eb2f96' },
    // Removed cybersecurite as it's not in the database schema or topic_config.py
  };

  const module = {
    id: moduleId,
    name: moduleId.charAt(0).toUpperCase() + moduleId.slice(1),
    ...moduleIcons[moduleId] || { icon: '📚', color: '#595959' }, // Fallback for unknown modules
  };

  const lessons = content.filter((c) => c.module_id === moduleId);

  const handleOpenLesson = async (lessonId) => {
    try {
      // Assuming lesson content is accessible via URL or PDF
      const lesson = content.find((c) => c.lesson_id === lessonId);
      if (lesson.pdf_path) {
        window.electronAPI.getAssetPath(lesson.pdf_path).then((path) => {
          window.open(path, '_blank');
        });
      } else if (lesson.url) {
        window.open(lesson.url, '_blank');
      } else {
        console.warn(`No accessible content for lesson ${lessonId}`);
      }
    } catch (error) {
      console.error('Error opening lesson:', error);
    }
  };

  const handleOpenQuiz = async (lessonId) => {
    try {
      const lesson = content.find((c) => c.lesson_id === lessonId);
      if (lesson.has_quiz && lesson.quiz_data) {
        // For now, log the quiz data; in a full implementation, open a quiz modal
        console.log('Opening quiz for lesson:', lessonId, JSON.parse(lesson.quiz_data));
        // Optionally, send to a quiz view via a new IPC channel
        await window.electronAPI.startQuiz({ lessonId, quizData: JSON.parse(lesson.quiz_data) });
      }
    } catch (error) {
      console.error('Error opening quiz:', error);
    }
  };

  return (
    <Card
      title={
        <Space>
          <span style={{ fontSize: '24px', color: module.color }}>{module.icon}</span>
          <span>{module.name}</span>
        </Space>
      }
      extra={
        <Tag color="blue">
          {progress.filter((p) => p.module_id === moduleId && p.completed).length}/{lessons.length} terminées
        </Tag>
      }
    >
      <List
        dataSource={lessons}
        renderItem={(lesson) => {
          const prog = progress.find((p) => p.lesson_id === lesson.lesson_id) || { progress: 0, completed: 0 };
          return (
            <List.Item
              actions={[
                <Button
                  key="open"
                  type="primary"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleOpenLesson(lesson.lesson_id)}
                >
                  {prog.completed ? 'Revoir' : 'Regarder'}
                </Button>,
                lesson.has_quiz && (
                  <Button
                    key="quiz"
                    type="default"
                    size="small"
                    icon={<QuestionCircleOutlined />}
                    onClick={() => handleOpenQuiz(lesson.lesson_id)}
                  >
                    Quiz
                  </Button>
                ),
              ]}
            >
              <List.Item.Meta
                title={lesson.title}
                description={
                  <Space direction="vertical">
                    <span>{lesson.description?.slice(0, 100)}...</span>
                    <span>
                      <Tag color={prog.completed ? 'green' : 'orange'}>
                        {prog.completed ? '✅ Terminé' : '⏳ Non commencé'}
                      </Tag>
                      {lesson.has_quiz && <Tag color="blue">Quiz disponible</Tag>}
                    </span>
                  </Space>
                }
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

export default ModuleView;
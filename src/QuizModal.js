// src/components/QuizModal.js
import { Modal, Radio, Button, Space } from 'antd';
import { useState } from 'react';

const QuizModal = ({ visible, quizData, onFinish, onCancel }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);

  const handleSelect = (value) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestion] = value;
      return newAnswers;
    });
  };

  const handleNext = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      onFinish(answers);
    }
  };

  if (!quizData) return null;

  const question = quizData.questions[currentQuestion];

  return (
    <Modal
      title={quizData.title}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="next" type="primary" onClick={handleNext} disabled={answers[currentQuestion] === undefined}>
          {currentQuestion === quizData.questions.length - 1 ? 'Terminer' : 'Suivant'}
        </Button>,
      ]}
    >
      <h4>Question {currentQuestion + 1}/{quizData.questions.length}</h4>
      <p>{question.question}</p>
      <Radio.Group onChange={e => handleSelect(e.target.value)} value={answers[currentQuestion]}>
        <Space direction="vertical">
          {question.options.map((option, index) => (
            <Radio key={index} value={index}>{option}</Radio>
          ))}
        </Space>
      </Radio.Group>
    </Modal>
  );
};

export default QuizModal;
import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import { UserOutlined, TrophyOutlined, FileOutlined } from '@ant-design/icons';

const Dashboard = ({ user, progress, badges, content }) => {
  return (
    <div>
      <h2>Tableau de Bord</h2>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="XP Total"
              value={user?.xp || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Badges"
              value={badges.length}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Leçons Complétées"
              value={progress.filter((p) => p.completed).length}
              prefix={<FileOutlined />}
            />
          </Card>
        </Col>
      </Row>
      <Card title="Aperçu du Contenu" style={{ marginTop: '16px' }}>
        <p>{content.length} leçons disponibles</p>
      </Card>
    </div>
  );
};

export default Dashboard;
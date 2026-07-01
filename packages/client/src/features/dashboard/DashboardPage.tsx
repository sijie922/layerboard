import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Button,
  Card,
  Typography,
  Row,
  Col,
  Modal,
  Form,
  Input,
  message,
  Empty,
  Dropdown,
  Space,
} from 'antd';
import {
  PlusOutlined,
  LogoutOutlined,
  UserOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { Board } from '@/types';
import { getBoards, createBoard, deleteBoard } from '@/api/board';
import { useUserStore } from '@/store/userStore';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function DashboardPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [_loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  void _loading;
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);

  const fetchBoards = async () => {
    setLoading(true);
    try {
      const data = await getBoards();
      setBoards(data);
    } catch {
      message.error('获取画板列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleCreate = async (values: { name: string }) => {
    try {
      await createBoard(values.name);
      message.success('画板创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchBoards();
    } catch {
      message.error('创建画板失败');
    }
  };

  const handleDelete = async (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Modal.confirm({
      title: '确认删除',
      content: '删除后将无法恢复，确定要删除这个画板吗？',
      okText: '删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteBoard(boardId);
          message.success('画板已删除');
          fetchBoards();
        } catch {
          message.error('删除失败');
        }
      },
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          borderBottom: '1px solid #f0f0f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Title level={4} style={{ color: '#6c5ce7', margin: 0 }}>
            🎨 LayerBoard
          </Title>
        </div>
        <Space>
          <Text type="secondary">
            <UserOutlined /> {user?.username}
          </Text>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  label: '退出登录',
                  icon: <LogoutOutlined />,
                  danger: true,
                  onClick: handleLogout,
                },
              ],
            }}
          >
            <Button type="text" icon={<UserOutlined />} shape="circle" />
          </Dropdown>
        </Space>
      </Header>

      <Content style={{ padding: '32px', overflow: 'auto' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Title level={3} style={{ margin: 0 }}>
              我的画板
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => setModalOpen(true)}
              style={{ borderRadius: 8 }}
            >
              新建画板
            </Button>
          </div>

          {boards.length === 0 ? (
            <Empty
              description="还没有画板，点击上方按钮创建一个"
              style={{ marginTop: 100 }}
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
                新建画板
              </Button>
            </Empty>
          ) : (
            <Row gutter={[24, 24]}>
              {boards.map((board) => (
                <Col xs={24} sm={12} md={8} lg={6} key={board._id}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: 12,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '1px solid #e8e6ff',
                    }}
                    styles={{
                      body: { padding: 20 },
                    }}
                    onClick={() => navigate(`/board/${board._id}`)}
                    actions={[
                      <EditOutlined key="edit" onClick={(e) => e.stopPropagation()} />,
                      <DeleteOutlined
                        key="delete"
                        onClick={(e) => handleDelete(board._id, e)}
                      />,
                    ]}
                  >
                    <div
                      style={{
                        height: 120,
                        background: 'linear-gradient(135deg, #f8f7ff 0%, #e8e6ff 100%)',
                        borderRadius: 8,
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 32 }}>🎨</Text>
                    </div>
                    <Title level={5} style={{ margin: '0 0 8px 0' }}>
                      {board.name}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {Array.isArray(board.members) ? board.members.length : 0} 位成员
                      {' · '}
                      {Array.isArray(board.groups) ? board.groups.length : 0} 个小组
                      {' · '}
                      {Array.isArray(board.areas) ? board.areas.length : 0} 个区域
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Content>

      <Modal
        title="新建画板"
        open={modalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="画板名称"
            rules={[{ required: true, message: '请输入画板名称' }]}
          >
            <Input placeholder="例如：产品规划看板" size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

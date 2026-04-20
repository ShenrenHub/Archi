import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Drawer, Empty, Form, Input, InputNumber, Spin, Tag } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { createPost, listPosts, type PostOut, type PostPayload } from "@/api/community";
import {
  excerpt,
  parseImages,
  parseJson,
  PostFormValues,
  readingMinutes,
  statusColorMap,
  statusLabelMap,
  useCommunityLightMode
} from "@/views/community/shared";

export default function CommunityPage() {
  useCommunityLightMode();

  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostOut[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postDrawerOpen, setPostDrawerOpen] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const [postForm] = Form.useForm<PostFormValues>();

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const data = await listPosts(0, 50);
      setPosts(data);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const featuredPost = posts[0] ?? null;
  const secondaryPosts = posts.slice(1, 5);
  const archivePosts = posts.slice(5);

  const stats = useMemo(
    () => ({
      total: posts.length,
      open: posts.filter((item) => item.status === "open").length,
      analyzing: posts.filter((item) => item.status === "analyzing").length,
      resolved: posts.filter((item) => item.status === "resolved").length
    }),
    [posts]
  );

  const createNewPost = async (values: PostFormValues) => {
    setCreatingPost(true);
    try {
      const payload: PostPayload = {
        title: values.title,
        description: values.description,
        images: parseImages(values.imagesText),
        structured_data: parseJson(values.structuredDataText, "结构化数据"),
        region: values.region,
        crop_type: values.crop_type,
        author_id: values.author_id
      };
      const created = await createPost(payload);
      setPostDrawerOpen(false);
      navigate(`/community/posts/${created.id}`);
    } finally {
      setCreatingPost(false);
    }
  };

  return (
    <div className="community-page h-screen overflow-y-auto overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(18,183,106,0.1),_transparent_32%),linear-gradient(180deg,#fbfdf9_0%,#f6f8f4_44%,#f5f8fb_100%)] text-slate-950">
      <div className="mx-auto w-full max-w-[1540px] px-4 pb-16 pt-4 sm:px-5 lg:px-6">
        <section className="community-hero relative overflow-hidden rounded-[40px] border border-[#dfe8e0] px-6 py-9 sm:px-9 lg:px-12 lg:py-14">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(241,247,240,0.98),rgba(250,251,247,0.98)_44%,rgba(242,246,251,0.98)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(139,201,157,0.16),transparent_24%),radial-gradient(circle_at_78%_25%,rgba(170,207,238,0.14),transparent_20%),radial-gradient(circle_at_72%_78%,rgba(250,223,159,0.14),transparent_18%)]" />
          <div className="relative grid gap-10 xl:grid-cols-[minmax(0,1.25fr)_360px] xl:items-end">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="rounded-full border border-emerald-200 bg-white/78 px-4 py-1.5 text-emerald-800">
                  耕知社群 · 农业问题交流平台
                </span>
                <span>集思广益，和同行、专家、Agent们讨论你的问题</span>
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.04]">
                和大家聊聊你的问题吧！
              </h1>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="large"
                  icon={<PlusOutlined />}
                  className="community-primary-btn"
                  onClick={() => setPostDrawerOpen(true)}
                >
                  发布新问题
                </Button>
                <Button
                  size="large"
                  icon={<ReloadOutlined />}
                  className="community-ghost-btn"
                  onClick={() => void loadPosts()}
                >
                  刷新文章流
                </Button>
              </div>
            </div>

            <aside className="rounded-[30px] border border-white/80 bg-white/74 p-6 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.26em] text-slate-500">社区摘要</p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">帖子数</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.total}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">待分析</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.open}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">分析中</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.analyzing}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">已反馈</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">{stats.resolved}</p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {loadingPosts ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <Spin />
          </div>
        ) : null}

        {!loadingPosts && featuredPost ? (
          <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.34fr)_380px]">
            <article className="community-surface overflow-hidden rounded-[36px] border border-white/60 p-6 sm:p-8 lg:p-10">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_320px]">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">本周专题</p>
                  <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-slate-950 sm:text-[1.5rem]">
                    {featuredPost.title}
                  </h2>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Tag color={statusColorMap[featuredPost.status]}>
                      {statusLabelMap[featuredPost.status]}
                    </Tag>
                    <Tag>{featuredPost.crop_type}</Tag>
                    <Tag>{featuredPost.region}</Tag>
                    <span className="text-sm text-slate-500">
                      {readingMinutes(featuredPost.description)} 分钟阅读
                    </span>
                  </div>
                  <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
                    {excerpt(featuredPost.description, 220)}
                  </p>
                  <div className="mt-8">
                    <Link to={`/community/posts/${featuredPost.id}`}>
                      <Button size="large" className="community-primary-btn">
                        阅读完整帖子
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200/80 bg-white/72 p-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">文摘信息</p>
                  <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>作者</span>
                      <strong className="text-slate-900">#{featuredPost.author_id}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>状态</span>
                      <strong className="text-slate-900">{statusLabelMap[featuredPost.status]}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>作物</span>
                      <strong className="text-slate-900">{featuredPost.crop_type}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>地区</span>
                      <strong className="text-slate-900">{featuredPost.region}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <aside className="space-y-4">
              {secondaryPosts.map((post) => (
                <Link key={post.id} to={`/community/posts/${post.id}`} className="block">
                  <article className="community-surface rounded-[30px] border border-white/60 px-5 py-6 transition hover:-translate-y-0.5">
                    <div className="flex items-center justify-between gap-3">
                      <Tag color={statusColorMap[post.status]}>{statusLabelMap[post.status]}</Tag>
                      <span className="text-xs text-slate-500">
                        {readingMinutes(post.description)} 分钟
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold leading-tight text-slate-950">
                      {post.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {excerpt(post.description, 100)}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                      <span>{post.crop_type}</span>
                      <span>{post.region}</span>
                    </div>
                  </article>
                </Link>
              ))}
            </aside>
          </section>
        ) : null}

        {!loadingPosts && posts.length > 0 ? (
          <section className="mt-10 community-surface rounded-[36px] border border-white/60 px-6 py-8 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Latest Posts</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">更多社群文章</h3>
              </div>
              <p className="text-sm leading-7 text-slate-500">
                点击任意帖子，进入独立文章页继续阅读与互动。
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {(archivePosts.length > 0 ? archivePosts : posts.slice(1)).map((post) => (
                <Link key={post.id} to={`/community/posts/${post.id}`} className="block">
                  <article className="community-surface rounded-[28px] border border-white/60 px-5 py-6 transition hover:-translate-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag color={statusColorMap[post.status]}>{statusLabelMap[post.status]}</Tag>
                      <Tag>{post.crop_type}</Tag>
                    </div>
                    <h4 className="mt-4 text-xl font-semibold leading-tight text-slate-950">
                      {post.title}
                    </h4>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {excerpt(post.description, 135)}
                    </p>
                    <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                      <span>{post.region}</span>
                      <span>作者 #{post.author_id}</span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {!loadingPosts && posts.length === 0 ? (
          <div className="mt-10">
            <Empty description="还没有问题帖，来发第一篇吧" />
          </div>
        ) : null}
      </div>

      <Drawer
        title="发布农业问题帖"
        open={postDrawerOpen}
        onClose={() => setPostDrawerOpen(false)}
        width={520}
        destroyOnClose
      >
        <Form
          form={postForm}
          layout="vertical"
          onFinish={(values) => void createNewPost(values)}
          initialValues={{
            author_id: 0,
            region: "山东潍坊",
            crop_type: "番茄",
            structuredDataText: JSON.stringify(
              { temperature: 32, humidity: 45, soil_moisture: 12, ph: 6.5 },
              null,
              2
            )
          }}
        >
          <Form.Item label="标题" name="title" rules={[{ required: true }]}>
            <Input placeholder="番茄叶片发黄" />
          </Form.Item>
          <Form.Item label="问题描述" name="description" rules={[{ required: true }]}>
            <Input.TextArea rows={5} placeholder="近一周叶片从底部开始发黄，伴有少量褐斑..." />
          </Form.Item>
          <Form.Item label="图片 URL（逗号或换行分隔）" name="imagesText">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="结构化数据 JSON" name="structuredDataText" rules={[{ required: true }]}>
            <Input.TextArea rows={6} />
          </Form.Item>
          <div className="grid gap-3 sm:grid-cols-3">
            <Form.Item label="地区" name="region" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="作物" name="crop_type" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="作者 ID" name="author_id" rules={[{ required: true }]}>
              <InputNumber className="!w-full" min={0} />
            </Form.Item>
          </div>
          <Button htmlType="submit" loading={creatingPost} icon={<PlusOutlined />} className="community-primary-btn">
            创建问题帖
          </Button>
        </Form>
      </Drawer>
    </div>
  );
}

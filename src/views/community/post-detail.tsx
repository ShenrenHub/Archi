import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Select,
  Spin,
  Switch,
  Tag,
  message
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  FireOutlined,
  MessageOutlined,
  ReloadOutlined,
  ThunderboltOutlined
} from "@ant-design/icons";
import { Link, useParams } from "react-router-dom";
import {
  archiveFeedback,
  createComment,
  createFeedback,
  createVote,
  getCommentsByPost,
  getFeedbackByPost,
  getPost,
  getSuggestionVotes,
  getSuggestionsByPost,
  triggerSuggestions,
  updatePost,
  type FeedbackOut,
  type PostOut,
  type PostStatus,
  type SuggestionOut,
  type VoteOut,
  type VoterRole
} from "@/api/community";
import { formatDateTime } from "@/utils/time";
import {
  agentLabelMap,
  CommentFormValues,
  excerpt,
  FeedbackFormValues,
  parseImages,
  parseJson,
  prettyJson,
  readingMinutes,
  roleOptions,
  statusColorMap,
  statusLabelMap,
  useCommunityLightMode
} from "@/views/community/shared";

export default function CommunityPostDetailPage() {
  useCommunityLightMode();

  const params = useParams();
  const postId = Number(params.postId);
  const [selectedPost, setSelectedPost] = useState<PostOut | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionOut[]>([]);
  const [comments, setComments] = useState<CommentOut[]>([]);
  const [feedback, setFeedback] = useState<FeedbackOut | null>(null);
  const [votes, setVotes] = useState<VoteOut[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingVotes, setLoadingVotes] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [triggeringSuggestions, setTriggeringSuggestions] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [archivingFeedback, setArchivingFeedback] = useState(false);
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [voteRole, setVoteRole] = useState<VoterRole>("user");
  const [voteUserId, setVoteUserId] = useState(0);
  const [archiveResult, setArchiveResult] = useState("");
  const [commentForm] = Form.useForm<CommentFormValues>();
  const [feedbackForm] = Form.useForm<FeedbackFormValues>();
  const [postEditorForm] = Form.useForm<{ status: PostStatus; description: string }>();

  const loadDetail = useCallback(async () => {
    if (!Number.isFinite(postId)) {
      return;
    }
    setLoadingDetail(true);
    try {
      const [post, suggestionList, commentList, feedbackItem] = await Promise.all([
        getPost(postId),
        getSuggestionsByPost(postId),
        getCommentsByPost(postId),
        getFeedbackByPost(postId).catch(() => null)
      ]);

      setSelectedPost(post);
      setSuggestions(suggestionList);
      setComments(commentList);
      setFeedback(feedbackItem);
      setArchiveResult("");
      postEditorForm.setFieldsValue({ status: post.status, description: post.description });
      feedbackForm.setFieldsValue({
        adopted_suggestion_id: suggestionList[0]?.id,
        is_effective: feedbackItem?.is_effective ?? true,
        description: feedbackItem?.description ?? "",
        newImagesText: feedbackItem?.new_images?.join("\n") ?? "",
        newDataText: prettyJson(feedbackItem?.new_data ?? {})
      });
    } finally {
      setLoadingDetail(false);
    }
  }, [feedbackForm, postEditorForm, postId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const structuredEntries = selectedPost ? Object.entries(selectedPost.structured_data ?? {}) : [];
  const featuredSuggestion = suggestions[0] ?? null;
  const otherSuggestions = suggestions.slice(1);

  const savePost = async () => {
    if (!selectedPost) return;
    const values = await postEditorForm.validateFields();
    setSavingPost(true);
    try {
      await updatePost(selectedPost.id, values);
      await loadDetail();
      message.success("帖子已更新");
    } finally {
      setSavingPost(false);
    }
  };

  const runSuggestions = async () => {
    if (!selectedPost) return;
    setTriggeringSuggestions(true);
    try {
      await triggerSuggestions(selectedPost.id);
      await loadDetail();
      message.success("5 个 Agent 建议已生成");
    } finally {
      setTriggeringSuggestions(false);
    }
  };

  const submitVote = async (suggestionId: number) => {
    await createVote({ suggestion_id: suggestionId, voter_id: voteUserId, voter_role: voteRole });
    setSuggestions(await getSuggestionsByPost(postId));
    message.success("投票成功");
  };

  const openVotes = async (suggestionId: number) => {
    setVoteModalOpen(true);
    setLoadingVotes(true);
    try {
      setVotes(await getSuggestionVotes(suggestionId));
    } finally {
      setLoadingVotes(false);
    }
  };

  const submitComment = async (values: CommentFormValues) => {
    setSubmittingComment(true);
    try {
      await createComment({
        post_id: postId,
        content: values.content,
        author_id: values.author_id,
        author_role: values.author_role,
        parent_id: values.parent_id ?? null
      });
      setComments(await getCommentsByPost(postId));
      commentForm.resetFields();
      commentForm.setFieldsValue({ author_id: 0, author_role: "user" });
      message.success("评论已发布");
    } finally {
      setSubmittingComment(false);
    }
  };

  const submitFeedback = async (values: FeedbackFormValues) => {
    setSubmittingFeedback(true);
    try {
      setFeedback(
        await createFeedback({
          post_id: postId,
          adopted_suggestion_id: values.adopted_suggestion_id,
          is_effective: values.is_effective,
          description: values.description,
          new_images: parseImages(values.newImagesText),
          new_data: parseJson(values.newDataText, "反馈数据")
        })
      );
      await loadDetail();
      message.success("反馈已提交");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const sendArchive = async () => {
    if (!feedback) return;
    setArchivingFeedback(true);
    try {
      const result = await archiveFeedback(feedback.id);
      setArchiveResult(`${result.message} · Case #${result.case_id}`);
      message.success("反馈已归档到案例库");
    } finally {
      setArchivingFeedback(false);
    }
  };

  if (!Number.isFinite(postId)) {
    return (
      <div className="community-page flex h-screen items-center justify-center">
        <Empty description="帖子 ID 无效" />
      </div>
    );
  }

  return (
    <div className="community-page h-screen overflow-y-auto overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(18,183,106,0.08),_transparent_36%),linear-gradient(180deg,#fcfdfa_0%,#f6f8f4_42%,#f5f8fb_100%)] text-slate-950">
      <div className="mx-auto w-full max-w-[1260px] px-4 pb-20 pt-5 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link to="/community">
            <Button icon={<ArrowLeftOutlined />} className="community-ghost-btn">
              返回社群首页
            </Button>
          </Link>
          <Button icon={<ReloadOutlined />} className="community-secondary-btn" onClick={() => void loadDetail()}>
            刷新文章
          </Button>
        </div>

        {loadingDetail && !selectedPost ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <Spin />
          </div>
        ) : selectedPost ? (
          <>
            <article className="community-surface overflow-hidden rounded-[40px] border border-white/60 px-6 py-9 sm:px-10 lg:px-14 lg:py-14">
              <div className="mx-auto max-w-[820px]">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag color={statusColorMap[selectedPost.status]}>{statusLabelMap[selectedPost.status]}</Tag>
                  <Tag>{selectedPost.crop_type}</Tag>
                  <Tag>{selectedPost.region}</Tag>
                  <span className="text-sm text-slate-500">
                    作者 #{selectedPost.author_id} · {readingMinutes(selectedPost.description)} 分钟阅读
                  </span>
                </div>
                <p className="mt-6 text-xs uppercase tracking-[0.28em] text-slate-500">Community Post</p>
                <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
                  {selectedPost.title}
                </h1>
                <p className="mt-8 text-lg leading-9 text-slate-700">{selectedPost.description}</p>

                {selectedPost.images.length > 0 ? (
                  <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    {selectedPost.images.map((image) => (
                      <div key={image} className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-slate-100">
                        <img src={image} alt={selectedPost.title} className="h-72 w-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>

            <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-6">
                <section className="community-surface rounded-[34px] border border-white/60 px-6 py-8 sm:px-8">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Agent 专栏</p>
                      <h2 className="mt-2 text-3xl font-semibold text-slate-950">多视角分析建议</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <span>投票人 ID</span>
                      <InputNumber min={0} value={voteUserId} onChange={(value) => setVoteUserId(value ?? 0)} className="!w-24" />
                      <Select
                        value={voteRole}
                        onChange={setVoteRole}
                        className="!w-28"
                        options={roleOptions as unknown as { label: string; value: VoterRole }[]}
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button icon={<ThunderboltOutlined />} loading={triggeringSuggestions} className="community-primary-btn" onClick={() => void runSuggestions()}>
                      触发 5 个 Agent
                    </Button>
                  </div>

                  {featuredSuggestion ? (
                    <article className="community-highlight mt-8 rounded-[30px] px-6 py-7">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Tag color="green">{featuredSuggestion.agent_name}</Tag>
                          <Tag>{agentLabelMap[featuredSuggestion.agent_type]}</Tag>
                        </div>
                        <span className="text-xs text-slate-500">{formatDateTime(featuredSuggestion.created_at)}</span>
                      </div>
                      <p className="mt-5 text-lg leading-8 text-slate-800">{featuredSuggestion.content}</p>
                      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_250px]">
                        <div className="rounded-[24px] bg-white/80 p-5">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reasoning</p>
                          <p className="mt-3 text-sm leading-7 text-slate-600">{featuredSuggestion.reasoning}</p>
                        </div>
                        <div className="rounded-[24px] border border-slate-200/80 bg-white/76 p-5">
                          <div className="space-y-3 text-sm text-slate-700">
                            <div className="flex items-center justify-between"><span>总票数</span><strong>{featuredSuggestion.vote_summary.total_votes}</strong></div>
                            <div className="flex items-center justify-between"><span>用户票</span><strong>{featuredSuggestion.vote_summary.user_votes}</strong></div>
                            <div className="flex items-center justify-between"><span>专家票</span><strong>{featuredSuggestion.vote_summary.expert_votes}</strong></div>
                            <div className="flex items-center justify-between"><span>Agent票</span><strong>{featuredSuggestion.vote_summary.agent_votes}</strong></div>
                          </div>
                          <div className="mt-5 space-y-2">
                            <Button className="community-primary-btn w-full" onClick={() => void submitVote(featuredSuggestion.id)}>为焦点建议投票</Button>
                            <Button icon={<EyeOutlined />} className="community-secondary-btn w-full" onClick={() => void openVotes(featuredSuggestion.id)}>查看投票明细</Button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ) : (
                    <div className="mt-8">
                      <Empty description="当前帖子还没有 Agent 建议" />
                    </div>
                  )}

                  {otherSuggestions.length > 0 ? (
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {otherSuggestions.map((suggestion) => (
                        <article key={suggestion.id} className="rounded-[26px] border border-slate-200/80 bg-white/78 px-5 py-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Tag color="green">{suggestion.agent_name}</Tag>
                              <Tag>{agentLabelMap[suggestion.agent_type]}</Tag>
                            </div>
                            <span className="text-xs text-slate-500">{formatDateTime(suggestion.created_at)}</span>
                          </div>
                          <p className="mt-4 text-sm leading-7 text-slate-700">{excerpt(suggestion.content, 160)}</p>
                          <div className="mt-5 flex flex-wrap gap-3">
                            <Button className="community-primary-btn" onClick={() => void submitVote(suggestion.id)}>投票</Button>
                            <Button icon={<EyeOutlined />} className="community-secondary-btn" onClick={() => void openVotes(suggestion.id)}>明细</Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </section>

                <section className="community-surface rounded-[34px] border border-white/60 px-6 py-8 sm:px-8">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">社区评论</p>
                      <h2 className="mt-2 text-3xl font-semibold text-slate-950">现场讨论区</h2>
                    </div>
                    <Tag color="green">{comments.length} 条</Tag>
                  </div>

                  <Form
                    form={commentForm}
                    layout="vertical"
                    className="mt-6"
                    onFinish={(values) => void submitComment(values)}
                    initialValues={{ author_id: 0, author_role: "user" }}
                  >
                    <Form.Item label="评论内容" name="content" rules={[{ required: true }]}>
                      <Input.TextArea rows={4} placeholder="补充自己的经验、现场现象或者验证结果..." />
                    </Form.Item>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Form.Item label="作者 ID" name="author_id" rules={[{ required: true }]}><InputNumber className="!w-full" min={0} /></Form.Item>
                      <Form.Item label="角色" name="author_role" rules={[{ required: true }]}><Select options={["user", "expert", "agent"].map((value) => ({ label: value, value }))} /></Form.Item>
                      <Form.Item label="父评论 ID" name="parent_id"><InputNumber className="!w-full" min={1} /></Form.Item>
                    </div>
                    <Button htmlType="submit" loading={submittingComment} icon={<MessageOutlined />} className="community-primary-btn">
                      发布评论
                    </Button>
                  </Form>

                  <div className="mt-8 space-y-4">
                    {comments.map((comment) => (
                      <article key={comment.id} className="rounded-[24px] border border-slate-200/80 bg-white/76 px-5 py-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Tag>{comment.author_role}</Tag>
                            <span className="text-xs text-slate-500">作者 #{comment.author_id}</span>
                          </div>
                          <span className="text-xs text-slate-500">{formatDateTime(comment.created_at)}</span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-700">{comment.content}</p>
                      </article>
                    ))}
                    {comments.length === 0 ? <Empty description="还没有评论" /> : null}
                  </div>
                </section>

                <section className="community-surface rounded-[34px] border border-white/60 px-6 py-8 sm:px-8">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">执行反馈</p>
                      <h2 className="mt-2 text-3xl font-semibold text-slate-950">执行反馈与案例归档</h2>
                    </div>
                    {feedback ? <Tag color={feedback.is_effective ? "green" : "orange"}>{feedback.is_effective ? "方案有效" : "效果一般"}</Tag> : null}
                  </div>

                  <Form form={feedbackForm} layout="vertical" className="mt-6" onFinish={(values) => void submitFeedback(values)}>
                    <Form.Item label="采纳建议 ID" name="adopted_suggestion_id" rules={[{ required: true }]}>
                      <Select options={suggestions.map((item) => ({ label: `${item.agent_name} · #${item.id}`, value: item.id }))} />
                    </Form.Item>
                    <Form.Item label="是否有效" name="is_effective" valuePropName="checked">
                      <Switch checkedChildren="有效" unCheckedChildren="待观察" />
                    </Form.Item>
                    <Form.Item label="反馈说明" name="description" rules={[{ required: true }]}>
                      <Input.TextArea rows={5} />
                    </Form.Item>
                    <Form.Item label="新的图片 URL（逗号或换行分隔）" name="newImagesText">
                      <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item label="新的结构化数据 JSON" name="newDataText" rules={[{ required: true }]}>
                      <Input.TextArea rows={5} />
                    </Form.Item>
                    <Button htmlType="submit" loading={submittingFeedback} icon={<CheckCircleOutlined />} className="community-primary-btn">
                      提交执行反馈
                    </Button>
                  </Form>

                  {feedback ? (
                    <div className="mt-8 rounded-[26px] border border-emerald-200 bg-emerald-50/72 px-6 py-6">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <FireOutlined />
                        <span className="text-sm font-medium">最新执行记录</span>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-slate-700">{feedback.description}</p>
                      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-[18px] bg-white/78 p-4 text-xs leading-6 text-slate-600">
                        {prettyJson(feedback.new_data)}
                      </pre>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Button onClick={() => void sendArchive()} loading={archivingFeedback} className="community-secondary-btn">
                          归档到案例库
                        </Button>
                        {archiveResult ? <Tag color="green">{archiveResult}</Tag> : null}
                      </div>
                    </div>
                  ) : null}
                </section>
              </div>

              <aside className="space-y-6">
                <section className="community-editorial-panel rounded-[30px] border border-white/70 px-5 py-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">编辑手记</p>
                  <Form form={postEditorForm} layout="vertical" className="mt-5">
                    <Form.Item label="帖子状态" name="status" rules={[{ required: true }]}>
                      <Select options={(Object.keys(statusLabelMap) as PostStatus[]).map((value) => ({ label: statusLabelMap[value], value }))} />
                    </Form.Item>
                    <Form.Item label="修订描述" name="description" rules={[{ required: true }]}>
                      <Input.TextArea rows={5} />
                    </Form.Item>
                    <Button className="community-primary-btn w-full" loading={savingPost} onClick={() => void savePost()}>
                      保存帖子修订
                    </Button>
                  </Form>
                </section>

                <section className="community-surface rounded-[30px] border border-white/70 px-5 py-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">现场参数</p>
                  <div className="mt-5 grid gap-3">
                    {structuredEntries.map(([key, value]) => (
                      <div key={key} className="rounded-[22px] border border-slate-200/80 bg-white/78 px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{key}</p>
                        <p className="mt-2 text-lg font-medium text-slate-900">{String(value)}</p>
                      </div>
                    ))}
                    {structuredEntries.length === 0 ? <Empty description="暂无结构化数据" image={Empty.PRESENTED_IMAGE_SIMPLE} /> : null}
                  </div>
                </section>
              </aside>
            </section>
          </>
        ) : (
          <div className="flex min-h-[420px] items-center justify-center">
            <Empty description="没有找到这篇帖子" />
          </div>
        )}
      </div>

      <Modal title="投票明细" open={voteModalOpen} footer={null} onCancel={() => setVoteModalOpen(false)}>
        {loadingVotes ? (
          <div className="flex min-h-[180px] items-center justify-center"><Spin /></div>
        ) : (
          <List
            dataSource={votes}
            renderItem={(item) => (
              <List.Item>
                <div className="w-full">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-900">{item.voter_role}</span>
                    <span className="text-xs text-slate-500">{formatDateTime(item.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">投票人 #{item.voter_id}</p>
                </div>
              </List.Item>
            )}
            locale={{ emptyText: "暂无投票记录" }}
          />
        )}
      </Modal>
    </div>
  );
}

type CommentOut = {
  id: number;
  post_id: number;
  content: string;
  author_id: number;
  author_role: "user" | "expert" | "agent";
  parent_id: number | null;
  created_at: string;
};

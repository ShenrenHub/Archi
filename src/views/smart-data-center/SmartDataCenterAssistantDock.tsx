import { useEffect, useId, useState } from "react";
import { AudioOutlined } from "@ant-design/icons";
import { Button, Input, Modal, Tooltip } from "antd";

const { TextArea } = Input;

interface SmartDataCenterAssistantDockProps {
  pending: boolean;
  lastReply: string;
  onSubmit: (instruction: string) => Promise<boolean>;
}

const KeyboardGlyph = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h.01M11 14h2M17 14h.01" />
  </svg>
);

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return Boolean(
    target.closest("input, textarea, select, button, a, [contenteditable='true'], [role='button']")
  );
};

export const SmartDataCenterAssistantDock = ({
  pending,
  lastReply,
  onSubmit
}: SmartDataCenterAssistantDockProps) => {
  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const instructionTextAreaId = useId();
  const bubbleText = lastReply.trim();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== " " || event.repeat || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (open || pending || isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      setOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, pending]);

  const handleSubmit = async () => {
    const normalizedInstruction = instruction.trim();

    if (!normalizedInstruction) {
      return;
    }

    const success = await onSubmit(normalizedInstruction);

    if (!success) {
      return;
    }

    setInstruction("");
    setOpen(false);
  };

  return (
    <>
      <div className="pointer-events-none absolute bottom-4 right-4 z-30 flex flex-col items-end gap-3">
        <Tooltip title="语音控制即将开放">
          <button
            type="button"
            className="community-surface pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/60 text-xl text-slate-900 shadow-[0_18px_40px_rgba(121,145,127,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_46px_rgba(121,145,127,0.16)] dark:border-white/10 dark:text-white dark:shadow-[0_18px_40px_rgba(2,6,23,0.4)]"
          >
            <AudioOutlined />
          </button>
        </Tooltip>

        <div className="flex max-w-[calc(100vw-2rem)] items-end gap-3">
          {bubbleText ? (
            <div className="community-surface relative max-w-[min(320px,calc(100vw-6.5rem))] rounded-[22px] border border-white/60 px-4 py-3 text-sm leading-6 text-slate-700 shadow-[0_18px_42px_rgba(121,145,127,0.12)] transition duration-300 dark:border-white/10 dark:text-slate-100 dark:shadow-[0_18px_42px_rgba(2,6,23,0.4)]">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                Card Voice
              </div>
              <p className="line-clamp-4 break-words">{bubbleText}</p>
              <span className="absolute bottom-4 -right-1.5 h-3.5 w-3.5 rotate-45 border-b border-r border-white/60 bg-[rgba(247,250,246,0.98)] dark:border-white/10 dark:bg-[rgba(6,16,24,0.9)]" />
            </div>
          ) : null}

          <Tooltip title="键盘控制卡片">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="community-surface pointer-events-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/60 text-xl text-slate-900 shadow-[0_18px_40px_rgba(121,145,127,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_46px_rgba(121,145,127,0.16)] dark:border-white/10 dark:text-white dark:shadow-[0_18px_40px_rgba(2,6,23,0.4)]"
            >
              <KeyboardGlyph />
            </button>
          </Tooltip>
        </div>
      </div>

      <Modal
        open={open}
        title="键盘控制台"
        okText="发送"
        cancelText="关闭"
        confirmLoading={pending}
        afterOpenChange={(nextOpen) => {
          if (!nextOpen) {
            return;
          }

          window.requestAnimationFrame(() => {
            const textArea = document.getElementById(instructionTextAreaId) as HTMLTextAreaElement | null;

            if (!textArea) {
              return;
            }

            textArea.focus();
            const cursorPosition = textArea.value.length;
            textArea.setSelectionRange(cursorPosition, cursorPosition);
          });
        }}
        onOk={() => void handleSubmit()}
        onCancel={() => {
          if (!pending) {
            setOpen(false);
          }
        }}
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-500 dark:text-slate-300">
            例如：`我想查看一下湿度数据`、`打开全部卡片`、`关闭所有卡片`、`缩小全部卡片`、`打开温度、湿度和遥测曲线，并把它们都放大`
          </p>

          <TextArea
            id={instructionTextAreaId}
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            autoSize={{ minRows: 4, maxRows: 8 }}
            placeholder="输入你要调整的卡片指令"
            onPressEnter={(event) => {
              if (event.shiftKey) {
                return;
              }

              event.preventDefault();
              void handleSubmit();
            }}
          />
          <div className="flex justify-end">
            <Button
              type="link"
              size="small"
              onClick={() => setInstruction("我想查看一下湿度数据")}
            >
              查看湿度
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

<!--
  Иконка из набора Битрикс24 (@bitrix24/b24icons-vue) по короткому имени.
  Имена — в таблице ниже; новую иконку добавлять сюда же (импорт явный — в сборку попадают только они).
-->
<template>
  <component :is="icons[name]" v-if="icons[name]" class="hd-icon" aria-hidden="true" />
</template>

<script setup lang="ts">
import GitHubIcon from '@bitrix24/b24icons-vue/social/GitHubIcon'
import TelegramIcon from '@bitrix24/b24icons-vue/social/TelegramIcon'
import LinkIcon from '@bitrix24/b24icons-vue/outline/LinkIcon'
import CheckIcon from '@bitrix24/b24icons-vue/main/CheckIcon'
import ClockBackIcon from '@bitrix24/b24icons-vue/outline/ClockBackIcon'
import ClockIcon from '@bitrix24/b24icons-vue/outline/ClockIcon'
import BulletedListIcon from '@bitrix24/b24icons-vue/editor/BulletedListIcon'
import ChevronLeftLIcon from '@bitrix24/b24icons-vue/outline/ChevronLeftLIcon'
import ChevronRightLIcon from '@bitrix24/b24icons-vue/outline/ChevronRightLIcon'
import RulerAndPencilIcon from '@bitrix24/b24icons-vue/editor/RulerAndPencilIcon'
import TerminalIcon from '@bitrix24/b24icons-vue/file-type/TerminalIcon'
import PackageIcon from '@bitrix24/b24icons-vue/outline/PackageIcon'
import BoldSparkleIcon from '@bitrix24/b24icons-vue/main/BoldSparkleIcon'
import RobotIcon from '@bitrix24/b24icons-vue/main/RobotIcon'
import ChatIcon from '@bitrix24/b24icons-vue/button/ChatIcon'
import HelpIcon from '@bitrix24/b24icons-vue/button/HelpIcon'
import DownloadIcon from '@bitrix24/b24icons-vue/actions/DownloadIcon'
import FolderIcon from '@bitrix24/b24icons-vue/common-b24/FolderIcon'
import CloudIcon from '@bitrix24/b24icons-vue/button/CloudIcon'
import CompassIcon from '@bitrix24/b24icons-vue/main/CompassIcon'
import CopyIcon from '@bitrix24/b24icons-vue/outline/CopyIcon'
import LikeIcon from '@bitrix24/b24icons-vue/outline/LikeIcon'
import DislikeIcon from '@bitrix24/b24icons-vue/outline/DislikeIcon'
import Cross30Icon from '@bitrix24/b24icons-vue/actions/Cross30Icon'
import CopilotIcon from '@bitrix24/b24icons-vue/outline/CopilotIcon'
import FeedbackIcon from '@bitrix24/b24icons-vue/main/FeedbackIcon'
import KnowledgeBaseIcon from '@bitrix24/b24icons-vue/outline/KnowledgeBaseIcon'
import CodeIcon from '@bitrix24/b24icons-vue/common-service/CodeIcon'
import AiStarsQuestionIcon from '@bitrix24/b24icons-vue/outline/AiStarsQuestionIcon'
import BookOpenIcon from '@bitrix24/b24icons-vue/crm/BookOpenIcon'
import SunIcon from '@bitrix24/b24icons-vue/outline/SunIcon'
import MoonIcon from '@bitrix24/b24icons-vue/outline/MoonIcon'
import CopilotAiIcon from '@bitrix24/b24icons-vue/main/CopilotAiIcon'
import BroomIcon from '@bitrix24/b24icons-vue/outline/BroomIcon'
import CollapseLIcon from '@bitrix24/b24icons-vue/outline/CollapseLIcon'
import MarkdownIcon from '@bitrix24/b24icons-vue/file-type/MarkdownIcon'
import ChevronDownLIcon from '@bitrix24/b24icons-vue/outline/ChevronDownLIcon'

defineProps<{ name: string }>()

const icons: Record<string, unknown> = {
  'github': GitHubIcon,
  'telegram': TelegramIcon,
  'link': LinkIcon,
  'check': CheckIcon,
  'history': ClockBackIcon,
  'clock': ClockIcon,
  'list': BulletedListIcon,
  'chevron-left': ChevronLeftLIcon,
  'chevron-right': ChevronRightLIcon,
  'ruler': RulerAndPencilIcon,
  'terminal': TerminalIcon,
  'package': PackageIcon,
  'sparkles': BoldSparkleIcon,
  'bot': RobotIcon,
  'chat': ChatIcon,
  'help': HelpIcon,
  'download': DownloadIcon,
  'folder': FolderIcon,
  'cloud': CloudIcon,
  'compass': CompassIcon,
  'copy': CopyIcon,
  'like': LikeIcon,
  'dislike': DislikeIcon,
  'close': Cross30Icon,
  'copilot': CopilotIcon,
  'feedback': FeedbackIcon,
  'knowledge': KnowledgeBaseIcon,
  'code': CodeIcon,
  'question': AiStarsQuestionIcon,
  'book': BookOpenIcon,
  'markdown': MarkdownIcon,
  'clear': BroomIcon,
  'panel-close': CollapseLIcon,
  'sun': SunIcon,
  'moon': MoonIcon,
  'ai': CopilotAiIcon,
  'chevron-down': ChevronDownLIcon,
}
</script>

<style>
/* :where — нулевая специфичность: размер иконки задаёт место, где она стоит */
:where(.hd-icon) { display: inline-block; flex: 0 0 auto; width: 1.25em; height: 1.25em; fill: currentColor; }
</style>

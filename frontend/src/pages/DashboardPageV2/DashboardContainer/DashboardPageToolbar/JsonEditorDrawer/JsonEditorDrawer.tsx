import { KeyboardEvent, useCallback } from 'react';
import MEditor, { Monaco } from '@monaco-editor/react';
import { Color } from '@signozhq/design-tokens';
import { AlignLeft, Copy, Download, RotateCcw } from '@signozhq/icons';
import { Button } from '@signozhq/ui/button';
import { Typography } from '@signozhq/ui/typography';
import cx from 'classnames';
import { Drawer } from 'antd';
import type { DashboardtypesGettableDashboardV2DTO } from 'api/generated/services/sigNoz.schemas';
import { useIsDarkMode } from 'hooks/useDarkMode';
import { useCopyToClipboard } from 'react-use';
import { toast } from '@signozhq/ui/sonner';

import styles from './JsonEditorDrawer.module.scss';
import { useJsonEditor } from './useJsonEditor';

interface JsonEditorDrawerProps {
	dashboard: DashboardtypesGettableDashboardV2DTO;
	isOpen: boolean;
	onClose: () => void;
}

function JsonEditorDrawer({
	dashboard,
	isOpen,
	onClose,
}: JsonEditorDrawerProps): JSX.Element {
	const isDarkMode = useIsDarkMode();
	const [, copyToClipboard] = useCopyToClipboard();

	const { draft, setDraft, validity, isDirty, isSaving, format, reset, apply } =
		useJsonEditor({ dashboard, isOpen, onApplied: onClose });

	const onCopy = useCallback((): void => {
		copyToClipboard(draft);
		toast.success('JSON copied to clipboard');
	}, [copyToClipboard, draft]);

	const onDownload = useCallback((): void => {
		const blob = new Blob([draft], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${dashboard.name || 'dashboard'}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}, [draft, dashboard.name]);

	const onKeyDown = useCallback(
		(event: KeyboardEvent<HTMLDivElement>): void => {
			if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
				event.preventDefault();
				void apply();
			}
		},
		[apply],
	);

	const setEditorTheme = useCallback((monaco: Monaco): void => {
		monaco.editor.defineTheme('my-theme', {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'string.key.json', foreground: Color.BG_VANILLA_400 },
				{ token: 'string.value.json', foreground: Color.BG_ROBIN_400 },
			],
			colors: { 'editor.background': Color.BG_INK_300 },
		});
	}, []);

	const applyDisabled = !isDirty || !validity.valid || isSaving;
	const validationText = validity.valid
		? `Valid JSON · ${validity.lineCount} lines`
		: `Line ${validity.errorLine ?? '?'} · ${validity.message ?? 'Invalid JSON'}`;

	return (
		<Drawer
			title="Dashboard JSON"
			placement="right"
			width={660}
			onClose={onClose}
			open={isOpen}
			rootClassName={styles.root}
			footer={
				<div className={styles.footer}>
					<Typography.Text
						className={cx(styles.validation, {
							[styles.validationValid]: validity.valid,
							[styles.validationInvalid]: !validity.valid,
						})}
						data-testid="json-editor-validation"
					>
						{validationText}
					</Typography.Text>
					<div className={styles.footerActions}>
						<Button
							variant="outlined"
							color="secondary"
							size="md"
							testId="json-editor-cancel"
							onClick={onClose}
						>
							Cancel
						</Button>
						<Button
							variant="solid"
							color="primary"
							size="md"
							testId="json-editor-apply"
							disabled={applyDisabled}
							onClick={(): void => void apply()}
						>
							Apply changes
						</Button>
					</div>
				</div>
			}
		>
			{/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
			<div className={styles.body} onKeyDown={onKeyDown}>
				<div className={styles.toolbar}>
					<Button
						variant="ghost"
						color="secondary"
						size="sm"
						prefix={<AlignLeft size={14} />}
						testId="json-editor-format"
						onClick={format}
					>
						Format
					</Button>
					<Button
						variant="ghost"
						color="secondary"
						size="sm"
						prefix={<Copy size={14} />}
						testId="json-editor-copy"
						onClick={onCopy}
					>
						Copy
					</Button>
					<Button
						variant="ghost"
						color="secondary"
						size="sm"
						prefix={<Download size={14} />}
						testId="json-editor-download"
						onClick={onDownload}
					>
						Download
					</Button>
					<div className={styles.toolbarSpacer} />
					<Button
						variant="ghost"
						color="secondary"
						size="sm"
						prefix={<RotateCcw size={14} />}
						testId="json-editor-reset"
						disabled={!isDirty}
						onClick={reset}
					>
						Reset
					</Button>
				</div>
				<div className={styles.editor}>
					<MEditor
						language="json"
						height="100%"
						value={draft}
						onChange={(value): void => setDraft(value ?? '')}
						options={{
							scrollbar: { alwaysConsumeMouseWheel: false },
							minimap: { enabled: false },
							fontSize: 13,
							fontFamily: 'Space Mono',
						}}
						theme={isDarkMode ? 'my-theme' : 'light'}
						beforeMount={setEditorTheme}
						onMount={(_, monaco): void => {
							void document.fonts.ready.then(() => monaco.editor.remeasureFonts());
						}}
					/>
				</div>
			</div>
		</Drawer>
	);
}

export default JsonEditorDrawer;

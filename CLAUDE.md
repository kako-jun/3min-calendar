# 3 min. Calendar

小規模店舗・個人事業主向けの「営業カレンダー画像作成アプリ」。
3分で今月の営業カレンダーを作成し、SNSでシェアできる。

## ブランディング

- **表記**: `3 min. Calendar`
- **読み方**: 「スリーミン カレンダー」

## 技術スタック

| カテゴリ       | 技術                    |
| -------------- | ----------------------- |
| フレームワーク | React 18 + TypeScript 5 |
| ビルドツール   | Vite 5                  |
| 状態管理       | Zustand 5               |
| スタイリング   | Tailwind CSS 3          |
| 日付操作       | date-fns 4              |
| 祝日判定       | date-holidays           |
| 国際化         | i18next + react-i18next |
| 画像キャプチャ | html2canvas             |
| QRコード生成   | react-qrcode-logo       |
| アニメーション | framer-motion           |
| PWA            | vite-plugin-pwa         |
| データ保存     | IndexedDB               |

## プロジェクト構造

```
src/
├── main.tsx, App.tsx, index.css
├── hooks/
│   └── useLogoImage.ts
├── lib/
│   ├── types.ts, store.ts, storage.ts
│   ├── calendar.ts, capture.ts, holidays.ts, theme.ts
│   ├── qr.ts, time.ts, entry.ts
│   └── i18n/ (index.ts, ja.json, en.json)
└── components/
    ├── ui/ (SegmentedControl, ColorInput, ToggleSwitch, ImageSelector)
    ├── Calendar.tsx, CalendarGrid.tsx, DayEditor.tsx, DayRow.tsx
    ├── AppHeader.tsx, MonthSelector.tsx, ActionButtons.tsx
    ├── QuickInputButtons.tsx, EmojiPicker.tsx
    ├── SettingsPanel.tsx, QRPage.tsx
```

## 開発コマンド

```bash
npm run dev      # 開発サーバー
npm run build    # 本番ビルド
npm run lint     # フォーマット + 型チェック
```

## 詳細ドキュメント

- [開発の背景](docs/background.md)
- [アーキテクチャ](docs/architecture.md)
- [主要機能](docs/features.md)

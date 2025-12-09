# アーキテクチャ

## データモデル

### DayEntry（日ごとの入力データ）

```typescript
interface DayEntry {
  date: string // YYYY-MM-DD（主キー）
  stamp: string | null // 定型スタンプ（'closed', 'available', 'few', 'full', 'reserved'）
  timeFrom: string // 開始時刻（'09:00'形式）
  timeTo: string // 終了時刻（'18:00'形式）
  text: string // 予定コメント（自由テキスト）
}
```

### Settings（アプリ設定）

```typescript
interface Settings {
  weekStartsOn: 0 | 1 // 0: 日曜始まり, 1: 月曜始まり
  appTheme: 'light' | 'dark' // アプリUI全体のテーマ
  calendarTheme: CalendarThemeId // カレンダー画像のデフォルトテーマ
  gridStyle: 'rounded' | 'lined' // グリッド表示スタイル
  language: 'ja' | 'en'
  country: CountryCode // 'JP' | 'US' | 'GB' | ... （20カ国）
  shopName: string // カレンダーに表示する店名
  shopLogo: string | null // 店名ロゴ画像（Base64）
  showHolidays: boolean // 祝日を色分け表示するか
  showRokuyo: boolean // 六曜を表示するか
  useWareki: boolean // 和暦を使用するか
  backgroundImage: string | null // 背景画像（Base64）
  backgroundOpacity: number // 背景画像の透明度（0-1）
}
```

### CalendarComments（月ごとのコメント）

```typescript
// キー: "YYYY-MM"（例: "2025-12"）
type CalendarComments = Record<string, string>
```

### CalendarThemes（月ごとのテーマ）

```typescript
// キー: "YYYY-MM"、値未設定時はsettings.calendarThemeを使用
type CalendarThemes = Record<string, CalendarThemeId>
```

## テーマシステム

### アプリテーマ（AppTheme）

アプリUI全体の外観。`'light'` または `'dark'` の2種類。

### カレンダーテーマ（CalendarThemeId）

カレンダー画像のテーマ。14種類のプリセット（ライト系7色 + ダーク系7色の虹配色）。
月ごとに異なるテーマを設定可能。未設定の月はデフォルト（light）を使用。

```typescript
type CalendarThemeId =
  | 'light'
  | 'light-red'
  | 'light-orange'
  | 'light-yellow'
  | 'light-green'
  | 'light-blue'
  | 'light-purple'
  | 'dark'
  | 'dark-red'
  | 'dark-orange'
  | 'dark-yellow'
  | 'dark-green'
  | 'dark-blue'
  | 'dark-purple'

interface ThemeColors {
  bg: string // 背景色
  surface: string // カード等の背景
  text: string // 通常テキスト
  textMuted: string // 薄いテキスト
  accent: string // アクセント色
  sunday: string // 日曜・祝日の色
  saturday: string // 土曜の色
  holiday: string // 祝日の色
}
```

## IndexedDB構造

- **DB名**: `3min-db`
- **バージョン**: 1
- **オブジェクトストア**:
  - `calendar:entries`: 日ごとのエントリ（keyPath: `date`）
  - `data`: 汎用key-valueストア（keyPath: `key`）
    - `calendar:settings`: アプリ設定
    - `calendar:comments`: 月ごとのコメント
    - `calendar:themes`: 月ごとのテーマ

## データ管理

### エクスポート/インポート

設定パネルからJSON形式でデータをエクスポート/インポート可能。

```typescript
interface ExportData {
  version: number
  exportedAt: string
  calendar: {
    entries: DayEntry[]
    comments: CalendarComments
    themes: CalendarThemes
    settings: Settings
  }
}
```

## 国際化（i18n）

- i18next + react-i18next
- ブラウザ言語を自動検出
- 設定で手動切り替え可能
- 翻訳ファイル: `src/lib/i18n/ja.json`, `en.json`

### 翻訳キー構造

```json
{
  "app": { "title": "アプリ名", "tagline": "キャッチコピー" },
  "calendar": { "today": "今日", "yearMonth": "年月表示" },
  "weekdays": { "sun": "日", "mon": "月", ... },
  "settings": { ... },
  "actions": { ... },
  "quickInput": { ... },
  "themes": { ... }
}
```

## 設計上の注意点

### 画像比率の一致（最重要）

CalendarGridは`aspect-square`で固定。キャプチャ時もこの比率を維持すること。
比率がずれるとユーザー体験が大きく損なわれる。

### コンポーネント分離

リファクタリングを避けるため、最初からコンポーネント化を徹底。
共通ロジックはlib/に切り出す。

### テーマのハードコード

テーマカラーはTailwindクラスではなくインラインstyleで適用。
これにより動的なテーマ切り替えが可能。

### 再利用可能なUIコンポーネント（components/ui/）

共通UIパターンは`components/ui/`ディレクトリに切り出し:

- **SegmentedControl**: 複数選択肢からひとつを選ぶボタングループ
- **ColorInput**: カラーピッカーとテキスト入力の組み合わせ
- **ToggleSwitch**: ON/OFFの切り替え（オプションでラベル付き）
- **ImageSelector**: 画像選択、プレビュー表示、削除機能

これらはテーマオブジェクト（`AppThemeColors`型）を受け取り、動的にスタイル適用。

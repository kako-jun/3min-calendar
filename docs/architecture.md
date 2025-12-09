# アーキテクチャ

## データモデル

### DayEntry（日ごとの入力データ）

```typescript
interface DayEntry {
  date: string // YYYY-MM-DD（主キー）
  stamp: string | null // 定型スタンプ（'closed', 'available', 'few', 'full', 'unavailable'）
  timeFrom: string // 開始時刻（'09:00'形式）
  timeTo: string // 終了時刻（'18:00'形式）
  text: string // 自由テキスト
}
```

### Settings（アプリ設定）

```typescript
interface Settings {
  weekStartsOn: 0 | 1 // 0: 日曜始まり, 1: 月曜始まり
  theme: ThemeId // 14種類のプリセット（ライト系7色 + ダーク系7色）
  language: 'ja' | 'en'
  country: CountryCode // 'JP' | 'US' | 'GB' | ... （20カ国）
  shopName: string // カレンダーに表示する店名
  showHolidays: boolean // 祝日を色分け表示するか
  showRokuyo: boolean // 六曜を表示するか
  useWareki: boolean // 和暦を使用するか
}
```

### Template（定休日パターン）

```typescript
interface Template {
  id: string
  name: string // 「毎週水曜定休」等
  weekdayDefaults: Record<number, string> // 曜日ごとのデフォルト値
}
```

## テーマシステム

14種類のプリセットテーマ（ライト系7色 + ダーク系7色の虹配色）。カスタムカラーは意図的に非対応。

```typescript
type ThemeId =
  | 'light-red'
  | 'light-orange'
  | 'light-yellow'
  | 'light-green'
  | 'light-blue'
  | 'light-indigo'
  | 'light-violet'
  | 'dark-red'
  | 'dark-orange'
  | 'dark-yellow'
  | 'dark-green'
  | 'dark-blue'
  | 'dark-indigo'
  | 'dark-violet'

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

- **DB名**: `3min-calendar-db`
- **バージョン**: 2
- **ストア**:
  - `entries`: 日ごとのテキスト（keyPath: `date`）
  - `settings`: 設定（keyPath: `key`）
  - `templates`: テンプレート（keyPath: `id`）

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

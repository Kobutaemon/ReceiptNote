-- split_groups テーブルにアイコンと色のカラムを追加

-- icon_name カラムを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'split_groups' AND column_name = 'icon_name'
  ) THEN
    ALTER TABLE split_groups ADD COLUMN icon_name TEXT DEFAULT 'Users';
  END IF;
END $$;

-- icon_color カラムを追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'split_groups' AND column_name = 'icon_color'
  ) THEN
    ALTER TABLE split_groups ADD COLUMN icon_color TEXT DEFAULT 'blue';
  END IF;
END $$;

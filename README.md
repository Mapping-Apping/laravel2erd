
# Laravel2ERD (V2 avaiable here: https://github.com/Priom7/laravel2doc)

[![npm](https://img.shields.io/npm/v/@priom7/laravel2erd?color=blue)](https://www.npmjs.com/package/@priom7/laravel2erd)
[![npm downloads](https://img.shields.io/npm/dt/@priom7/laravel2erd?label=Downloads&color=green)](https://www.npmjs.com/package/@priom7/laravel2erd)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E=14.0.0-brightgreen)](https://nodejs.org/)
[![Made with ❤️ by Priom7](https://img.shields.io/badge/Made%20with-%E2%9D%A4%EF%B8%8F%20by%20Priom7-blueviolet)](https://github.com/priom7)

> A CLI tool that **automatically generates Entity-Relationship Diagrams (ERD)** for Laravel applications using model analysis.

---

## 📦 Installation

```bash
npm install @priom7/laravel2erd
````

Or use it directly with `npx`:

```bash
npx @priom7/laravel2erd
```

---

## 🚀 Features

* 📊 Automatically analyze Laravel models to generate ERDs
* 🔍 Detect table names, attributes, and data types
* 🔄 Map relationships (One-to-One, One-to-Many, Many-to-Many)
* 🖼️ Interactive web-based diagram viewer with zoom controls
* 💾 Export diagrams as SVG for documentation

---

## 🖥️ Usage

### Basic usage

```bash
npx laravel2erd
```

### Custom options

```bash
npx laravel2erd \
  --output public/docs/erd \
  --models app/Models \
  --title "My Project ERD"
```

Once generated, you can view your ERD diagram in the browser at:

```
http://your-app-url/laravel2erd
```

---

## ⚙️ Options

| Option            | Description                          | Default               |
| ----------------- | ------------------------------------ | --------------------- |
| `-o, --output`    | Output directory for ERD             | `public/laravel2erd`  |
| `-m, --models`    | Directory containing Laravel models  | `app/Models`          |
| `-r, --relations` | Include relationships between models | `true`                |
| `-t, --title`     | Title of the diagram                 | `Laravel ERD Diagram` |

---

## 🧠 How It Works

Laravel2ERD performs static analysis on your Laravel model files to extract:

1. **Table structure**: Names, columns, and types
2. **Attributes**: From `fillable` arrays and `casts`
3. **Relationships**: Using Eloquent methods like `hasOne`, `belongsTo`, etc.

It then compiles this information into a clean [Mermaid.js](https://mermaid.js.org/) diagram rendered in a browser interface.

---

## 🖼️ Sample Output

<p align="center">
  <img src="https://github.com/Priom7/laravel2erd/blob/main/sample.png" alt="Laravel2ERD Sample Output" width="700">
</p>

---

## 📋 Example Model

```php
// app/Models/User.php
class User extends Model
{
    protected $fillable = [
        'name', 'email', 'password',
    ];
    
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];
    
    public function posts()
    {
        return $this->hasMany(Post::class);
    }
}
```

🧩 This model will be visualized with all attributes and relationships in the ERD diagram.

---

## 📄 License

Licensed under the [MIT License](LICENSE).

---

## 👤 Author

Made with ❤️ by [@priom7](https://github.com/priom7)

---

> 🌟 If you find this package useful, please consider starring the repo to show your support!



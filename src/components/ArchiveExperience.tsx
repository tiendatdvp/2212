"use client";

import Image from "next/image";
import { useLayoutEffect, useMemo, useState } from "react";
import archive from "@/data/archive-structured.json";
import dossierDetailsPayload from "@/data/dossier-details.json";

interface RawCard {
  href: string;
  text: string;
  image: {
    src: string;
    alt: string;
  } | null;
}

interface ParsedCard {
  href: string;
  slug: string;
  eyebrow: string;
  code: string;
  date: string;
  status: string;
  title: string;
  description: string;
  codename: string;
  pages: string;
  body: string[];
  image: string;
  alt: string;
}

const series = ["TẤT CẢ", "B", "C32", "H", "J", "K7", "M", "R", "S"];
const counts: Record<string, number> = {
  "TẤT CẢ": 37,
  B: 4,
  C32: 18,
  H: 2,
  J: 4,
  K7: 5,
  M: 1,
  R: 1,
  S: 2,
};

interface DossierDetailMeta {
  label: string;
  value: string;
  red: boolean;
}

interface DossierDetail {
  slug: string;
  href: string;
  title: string;
  series: string;
  head: string;
  declassified: string;
  stamp: string;
  meta: DossierDetailMeta[];
  hero: {
    src: string;
    alt: string;
    width: number;
    height: number;
    localSrc: string;
  } | null;
  paragraphs: string[];
  foot: string;
  ok: boolean;
  gate: boolean;
}

const dossierDetails = dossierDetailsPayload.details as DossierDetail[];

function sanitizeAssetName(url: string, position: number) {
  const parsed = new URL(url);
  const raw = decodeURIComponent(parsed.pathname.split("/").pop() ?? "asset.bin");
  const dot = raw.lastIndexOf(".");
  const ext = dot >= 0 ? raw.slice(dot) : ".bin";
  const stem = dot >= 0 ? raw.slice(0, dot) : raw;
  const safe = stem
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);

  return `/images/2212/archive/${String(position).padStart(2, "0")}-${safe || "asset"}${ext}`;
}

function slugFromHref(href: string) {
  try {
    return new URL(href).pathname.split("/").filter(Boolean).at(-1) ?? "ho-so";
  } catch {
    return "ho-so";
  }
}

function findCodenameLine(lines: string[]) {
  return lines.find((line) => line.toUpperCase().includes("DANH:"));
}

function removeCodenameLabel(value: string) {
  return value.replace(/^.*DANH:\s*/i, "");
}

function resetDetailScroll() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  document.querySelector(".file-detail")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.querySelector(".dossier-page--modal")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function parseRawCard(card: RawCard, imagePosition: number): ParsedCard {
  const lines = card.text.split("\n").map((line) => line.trim());
  const nonEmpty = lines.filter(Boolean);
  const titleIndex = nonEmpty.findIndex((line) => line.includes("ĐÃ GIẢI MẬT")) + 2;
  const title = nonEmpty[titleIndex] ?? nonEmpty[3] ?? "";
  const codename = findCodenameLine(nonEmpty) ?? "MẬT DANH: * * * * *";
  const pages = nonEmpty.find((line) => line.endsWith("TRANG")) ?? "";
  const bodyStart = Math.max(titleIndex + 1, 0);
  const bodyEnd = nonEmpty.findIndex((line) => line.toUpperCase().includes("DANH:"));
  const body = nonEmpty.slice(bodyStart, bodyEnd > bodyStart ? bodyEnd : undefined);

  return {
    href: card.href,
    slug: slugFromHref(card.href),
    eyebrow: nonEmpty[0] ?? "",
    code: nonEmpty[1] ?? "",
    date: nonEmpty[2] ?? "",
    status: nonEmpty[3] ?? "",
    title,
    description: nonEmpty[titleIndex + 1] ?? "",
    codename,
    pages,
    body: body.length > 0 ? body : [nonEmpty[titleIndex + 1] ?? ""],
    image: card.image ? sanitizeAssetName(card.image.src, imagePosition) : "",
    alt: card.image?.alt ?? title,
  };
}

function splitCardText(card: RawCard, imagePosition: number) {
  const lines = card.text.split("\n").map((line) => line.trim()).filter(Boolean);
  return {
    status: lines[0] ?? "",
    code: lines[1] ?? "",
    title: lines[2] ?? "",
    description: lines.slice(3).join(" "),
    image: card.image ? sanitizeAssetName(card.image.src, imagePosition) : "",
    alt: card.image?.alt ?? lines[2] ?? "",
    href: card.href,
  };
}

function SectionHead({
  eyebrow,
  sheet,
  title,
  lede,
}: {
  eyebrow: string;
  sheet: string;
  title: string;
  lede: string;
}) {
  return (
    <div className="sa-section__head">
      <div className="sa-section__copy">
        <div className="sa-eyebrow">
          <span className="sa-eyebrow__tag">{eyebrow}</span>
          <span className="sa-eyebrow__rule" />
          <span className="sa-eyebrow__sheet">{sheet}</span>
        </div>
        <h2 className="sa-h2">{title}</h2>
        <p className="sa-lede">{lede}</p>
      </div>
    </div>
  );
}

export function ArchiveExperience({ onLogout }: { onLogout?: () => void }) {
  const [selectedFile, setSelectedFile] = useState<ParsedCard | null>(null);
  const [activeSeries, setActiveSeries] = useState("TẤT CẢ");
  const files = useMemo(
    () => (archive.files as RawCard[]).map((card, index) => parseRawCard(card, index + 3)),
    [],
  );
  const detailsBySlug = useMemo(
    () => new Map(dossierDetails.map((detail) => [detail.slug, detail])),
    [],
  );
  const selectedDetail = selectedFile ? detailsBySlug.get(selectedFile.slug) : undefined;
  function openFile(file: ParsedCard) {
    resetDetailScroll();
    setSelectedFile(file);
    requestAnimationFrame(resetDetailScroll);
  }
  const visibleFiles =
    activeSeries === "TẤT CẢ"
      ? files
      : files.filter((file) => file.eyebrow === activeSeries);
  const docs = (archive.docs as RawCard[]).map((card, index) =>
    splitCardText(card, index + 40),
  );
  const civic = (archive.genericCards as RawCard[])
    .slice(0, 6)
    .map((card, index) => splitCardText(card, index + 45));
  const activities = (archive.sponsorCards as RawCard[]).map((card, index) =>
    splitCardText(card, index + 51),
  );
  const products = (archive.gear as RawCard[]).map((card, index) =>
    splitCardText(card, index + 53),
  );
  const commendations = (archive.figures as RawCard[]).map((card, index) =>
    splitCardText(card, index + 59),
  );
  const allies = (archive.allies as RawCard[]).map((card, index) =>
    splitCardText(card, index + 65),
  );

  return (
    <main className="archive">
      <Header onLogout={onLogout} />
      <Hero />
      <Marquee />
      <About />

      <section className="sa-section sa-section--alt" id="files">
        <div className="sa-section__inner">
          <SectionHead
            eyebrow="MỤC 02 // CASE FILES"
            sheet="TỜ 02/08"
            title="KHO HỒ SƠ"
            lede="Những series tiểu thuyết & tư liệu"
          />
          <div className="files__chips">
            {series.map((item) => (
              <button
                className="files__chip"
                type="button"
                aria-pressed={activeSeries === item}
                key={item}
                onClick={() => setActiveSeries(item)}
              >
                {item} <span>[{counts[item]}]</span>
              </button>
            ))}
          </div>
          <div className="files__grid">
            {visibleFiles.map((file) => (
              <FileCard
                file={file}
                key={`${file.code}-${file.title}`}
                onOpen={openFile}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="sa-section" id="docs">
        <div className="sa-section__inner">
          <SectionHead
            eyebrow="MỤC 03 // MOTION ARCHIVE"
            sheet="TỜ 03/08"
            title="LẬT LẠI HỒ SƠ"
            lede="Series phim tư liệu — phát hành trên kênh YouTube chính thức của 2212 Viet Nam"
          />
          <div className="docs__grid">
            {docs.map((doc, index) => (
              <SimpleMediaCard item={doc} key={`${doc.href || doc.image || "doc"}-${index}`} />
            ))}
            <div className="doc-pending">
              <div className="doc-pending__bars">
                <span />
                <span />
                <span />
              </div>
              <p>CHƯA CÔNG BỐ<br />TƯ LIỆU ĐANG THẨM ĐỊNH</p>
            </div>
          </div>
        </div>
      </section>

      <ArchiveGrid
        alt
        id="civic"
        eyebrow="MỤC 04 // CIVIC OPS"
        sheet="TỜ 04/08"
        title="THIỆN NGUYỆN"
        lede="Những nhiệm vụ dân sự của 2212 Viet Nam"
        items={civic}
      />
      <ArchiveGrid
        id="activities"
        eyebrow="MỤC 05 // ACTIVITIES"
        sheet="TỜ 05/08"
        title="HOẠT ĐỘNG"
        lede="Những hoạt động, dự án & chiến dịch được 2212 Viet Nam tài trợ, đồng hành"
        items={activities}
        wide
      />
      <ArchiveGrid
        id="products"
        eyebrow="MỤC 06 // QUARTERMASTER"
        sheet="TỜ 06/08"
        title="SẢN PHẨM"
        lede="Được sản xuất & phân phối bởi 2212 Viet Nam"
        items={products}
      />
      <ArchiveGrid
        alt
        id="commendations"
        eyebrow="MỤC 07 // COMMENDATIONS"
        sheet="TỜ 07/08"
        title="KHEN THƯỞNG & GHI NHẬN"
        lede="Ghi nhận đóng góp của 2212 Viet Nam trong công tác thiện nguyện"
        items={commendations}
        compact
      />
      <ArchiveGrid
        id="allies"
        eyebrow="MỤC 08 // ALLIED NETWORK"
        sheet="TỜ 08/08"
        title="LIÊN MINH CÙNG 2212.VN"
        lede="Các thành viên chiến lược đồng hành cùng 2212 Viet Nam"
        items={allies}
        wide
      />
      <Footer />
      {selectedFile ? (
        <FileDetailPage
          detail={selectedDetail}
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      ) : null}
      <div aria-hidden="true" className="sa-scanlines" />
      <div aria-hidden="true" className="sa-vignette" />
    </main>
  );
}

function Header({ onLogout }: { onLogout?: () => void }) {
  const links = [
    ["KHO HỒ SƠ", "#files"],
    ["PHIM TÀI LIỆU", "#docs"],
    ["HOẠT ĐỘNG", "#activities"],
    ["SẢN PHẨM", "#products"],
    ["LIÊN MINH", "#allies"],
    ["LIÊN HỆ", "#footer"],
    ["THIỆN NGUYỆN", "#civic"],
  ];

  return (
    <>
      <div className="sa-classbar">
        <span className="sa-classbar__hazard" />
        <span className="sa-classbar__label">
          T&#192;I LI&#7878;U &#272;&#195; GI&#7842;I M&#7852;T &#8212; L&#431;U H&#192;NH C&#212;NG KHAI THEO QUY CH&#7870; T&#431; LI&#7878;U 2212VN/GM
        </span>
        <span className="sa-classbar__hazard" />
      </div>
      <header className="arc-header">
      <div className="arc-header__inner">
        <a className="arc-brand" href="#top">
          <Image
            className="arc-brand__logo"
            src="/images/2212/archive/01-2212VN-LG-3-removebg-preview.png"
            alt="2212"
            width={40}
            height={40}
            priority
          />
          <span className="arc-brand__name">
            <b>2212 VIET NAM</b>
            <span>SECURE ARCHIVE v4.0</span>
          </span>
        </a>
        <nav className="arc-nav" aria-label="Archive">
          {links.map(([label, href]) => (
            <a href={href} key={label}>
              {label}
            </a>
          ))}
          <a href="https://www.worldmonitor.app/dashboard">WORLD MONITOR</a>
        </nav>
        <div className="arc-header__actions">
          <span className="arc-badge arc-badge--reader">
            <i className="arc-badge__dot" />
            MỨC ĐỘ TRUY CẬP · CẤP 1
          </span>
          <button
            className="arc-logout"
            type="button"
            title="Ket thuc phien va quay ve man dang nhap"
            onClick={onLogout}
          >
            THO&#193;T &#9656;
          </button>
        </div>
      </div>
      </header>
    </>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div aria-hidden="true" className="hero__grid" />
      <div aria-hidden="true" className="hero__sweep" />
      <span className="hero__ping hero__ping--han"><i /><em /><span>21.02°N 105.85°E — HAN</span></span>
      <span className="hero__ping hero__ping--ts hero__ping--red"><i /><em /><span>08.64°N 111.92°E — TS</span></span>
      <span className="hero__ping hero__ping--dad"><i /><em /><span>16.07°N 108.22°E — DAD</span></span>
      <div className="hero__inner">
        <div className="hero__col">
          <div className="hero__eyebrow">HỒ SƠ SỐ 2212/GM-01 — ĐÃ GIẢI MẬT</div>
          <h1 className="hero__title">
            KHO LƯU TRỮ
            <br />
            <b>2212</b> VIET NAM
          </h1>
          <p className="hero__desc">&quot;Si vis pacem, para bellum.&quot;</p>
          <div className="hero__cta">
            <a className="sa-btn" href="#files">MỞ KHO HỒ SƠ ▸</a>
            <a className="sa-btn sa-btn--ghost" href="#docs">PHIM TÀI LIỆU</a>
          </div>
          <div className="hero__stats">
            <span className="hero__stat"><b>37</b> HỒ SƠ GIẢI MẬT</span>
            <span className="hero__stat"><b className="gold">08</b> SERIES</span>
            <span className="hero__stat"><b>●</b> ĐANG CẬP NHẬT</span>
          </div>
        </div>
        <aside className="hero__aside">
          <div className="hero__quote">
            <span className="sa-corner tl" />
            <span className="sa-corner tr" />
            <span className="sa-corner bl" />
            <span className="sa-corner br" />
            <div className="hero__quote-head"><span>TRÍCH DẪN</span><span>No. 1951-06-05</span></div>
            <span className="hero__quote-tag">MAT</span>
            <div className="hero__quote-mark">“</div>
            <p className="hero__quote-text">
              &quot;Tình báo là tai mắt: Tai phải tỏ, mắt phải sáng, thì đầu óc định kế hoạch mới đúng. Công tác tình báo là một công tác khoa học: phải bí mật, khéo léo, cẩn thận và kiên nhẫn...&quot;
            </p>
            <p className="hero__quote-attr">
              — CHỦ TỊCH HỒ CHÍ MINH<br />
              <span>THƯ GỬI HỘI NGHỊ TÌNH BÁO TOÀN QUỐC · 05.06.1951</span>
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Marquee() {
  const text = " + + + THÔNG BÁO: HỒ SƠ “S — CONTAINER SỐ 2” ĐÃ ĐƯỢC GIẢI MẬT + + + GUARDIANSHIP · DETERMINATION · DARING · INTELLIGENCE + + + TUYỂN CỘNG TÁC VIÊN BAN TƯ LIỆU - LIÊN HỆ BAN ĐIỀU HÀNH + + + ";

  return (
    <div className="marquee">
      <div className="marquee__track">
        <span className="marquee__item">{text}</span>
        <span className="marquee__item">{text}</span>
      </div>
    </div>
  );
}

function About() {
  const values = [
    ["TRUNG THÀNH", "GUARDIANSHIP"],
    ["BẢN LĨNH", "DETERMINATION"],
    ["QUẢ CẢM", "DARING"],
    ["MƯU TRÍ", "INTELLIGENCE"],
  ];

  return (
    <section className="sa-section" id="briefing">
      <div className="sa-section__inner about__grid">
        <div className="about__main">
          <SectionHead
            eyebrow="MỤC 01 // BRIEFING"
            sheet="TỜ 01/08"
            title="CHÚNG TÔI LÀ 2212 VIET NAM"
            lede=""
          />
          <div className="about__values">
            {values.map(([title, subtitle]) => (
              <div className="about__value" key={title}>
                <b>{title}</b>
                <span>{subtitle}</span>
              </div>
            ))}
          </div>
          <p className="about__p">
            2212 Viet Nam dành cho những người yêu thích lịch sử, quân sự, an ninh và lĩnh vực tình báo. Chúng tôi hướng tới việc xây dựng một cộng đồng, nơi mọi người đều có thể chia sẻ kiến thức và thảo luận chuyên sâu một cách văn minh.
          </p>
          <p className="about__p">
            2212 Viet Nam không chỉ có các câu chuyện, nơi đây còn là nơi kết nối những con người có chung niềm đam mê khám phá những huyền thoại, sự kiện và góc nhìn chiến lược phía sau lịch sử.
          </p>
        </div>
        <figure className="about__figure">
          <div className="about__figure-frame">
            <Image src="/images/2212/archive/02-about-desk.jpg" alt="Archive desk" width={900} height={1200} className="about__img" />
            <span className="about__stamp">ĐÃ GIẢI MẬT</span>
          </div>
          <figcaption className="about__meta"><span>BAN BIÊN TẬP, 02:14 AM</span><span>REF: 2212-A01</span></figcaption>
        </figure>
      </div>
    </section>
  );
}

function FileCard({
  file,
  onOpen,
}: {
  file: ParsedCard;
  onOpen: (file: ParsedCard) => void;
}) {
  return (
    <button className="file" type="button" onClick={() => onOpen(file)}>
      <div className="file__tab">
        <span className="file__series">{file.eyebrow}</span>
        <span className="file__code">{file.code}</span>
        <span className="file__date">{file.date}</span>
      </div>
      <div className="file__thumb">
        <Image src={file.image} alt={file.alt} width={900} height={506} />
        <span className="file__scrim" />
        <span className="file__declass">{file.status}</span>
        <span className="file__origin">ĐỘ MẬT GỐC: <s>TỐI MẬT</s> → CÔNG KHAI</span>
      </div>
      <div className="file__body">
        <h3 className="file__title">{file.title}</h3>
        <p className="file__excerpt">{file.description}</p>
        <p className="file__redact">{file.codename.replace("MẬT DANH:", "MẬT DANH:")} <mark>█████</mark></p>
        <div className="file__foot">
          <span className="open">MỞ HỒ SƠ ▸</span>
          <span className="pages">{file.pages}</span>
        </div>
      </div>
    </button>
  );
}

// Kept temporarily as a visual fallback while the clone moves to the page-like detail modal.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FileDetail({
  file,
  onClose,
}: {
  file: ParsedCard;
  onClose: () => void;
}) {
  return (
    <div className="file-detail" role="dialog" aria-modal="true" aria-labelledby="file-detail-title">
      <button className="file-detail__backdrop" type="button" aria-label="Đóng hồ sơ" onClick={onClose} />
      <article className="file-detail__panel file-detail__panel--page">
        <span className="sa-corner tl" />
        <span className="sa-corner tr" />
        <span className="sa-corner bl" />
        <span className="sa-corner br" />
        <div className="file-detail__top">
          <div>
            <span className="file-detail__eyebrow">{`${file.eyebrow} // ${file.code}`}</span>
            <h2 className="file-detail__title" id="file-detail-title">{file.title}</h2>
          </div>
          <button className="file-detail__close" type="button" aria-label="Đóng hồ sơ" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="file-detail__article">
          <div className="file-detail__article-head">
            <span>{file.status}</span>
            <span>{file.date}</span>
            <span>{file.pages}</span>
            <span>{removeCodenameLabel(file.codename)}</span>
          </div>
          <div className="file-detail__hero">
            {file.image ? (
              <Image src={file.image} alt={file.alt} width={1200} height={675} />
            ) : null}
            <span className="file-detail__stamp">{file.status}</span>
          </div>
          <div className="file-detail__body">
            <dl className="file-detail__meta">
              <div><dt>NGÀY</dt><dd>{file.date}</dd></div>
              <div><dt>MẬT DANH</dt><dd>{file.codename.replace("Máº¬T DANH:", "")}</dd></div>
              <div><dt>DUNG LƯỢNG</dt><dd>{file.pages}</dd></div>
              <div><dt>MÃ URL</dt><dd>{file.slug}</dd></div>
            </dl>
            <div className="file-detail__copy file-detail__copy--article">
              {file.body.map((paragraph, index) => (
                <p key={`${file.slug}-fallback-${index}`}>{paragraph}</p>
              ))}
            </div>
            <div className="file-detail__actions">
              <a className="sa-btn" href={file.href} target="_blank" rel="noreferrer">
                MỞ BẢN GỐC ↗
              </a>
              <button className="sa-btn sa-btn--ghost" type="button" onClick={onClose}>
                QUAY LẠI KHO
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

const h3DossierParagraphs = [
  "Series “H” – Dựa trên các sự kiện lịch sử có thật",
  "Kỳ 1 – H3/H67: BÓNG MA THÀNH SÀI GÒN",
  "",
  "Trong thế giới tình báo, nơi của những cuộc chiến ngầm, nơi tiếng súng chưa vang mà máu đã đổ… tồn tại một con người như chiếc kim giữa đống lửa, đi giữa hai làn đạn mà vẫn giữ nụ cười như thể cuộc đời chỉ là một vở kịch. Ông là H3. Là Ba Lễ. Là Ba Nghĩa. Là người đã dùng cả cuộc đời để đánh cờ giữa lòng kẻ thù.",
  "“Nghị sĩ đỏ” giữa lòng địch",
  "Thành phố Sài Gòn những năm 60, dưới ánh đèn vàng của rạp Eden và tiếng jazz rỉ rả từ phòng trà Continental, có một người đàn ông thường bước xuống từ chiếc Citroen mang biển số công vụ, đeo kính Ray-Ban với dáng vẻ của một chính khách quyền uy. Người ta gọi ông là “Nghị viên Ba Lễ” – Chủ tịch Ủy ban Lao động Xã hội Chiến binh của Hạ viện chính quyền Sài Gòn.",
  "Nhưng không ai biết rằng, đằng sau những bộ comple chỉn chu và những cuộc tiếp xúc với sĩ quan Mỹ cao cấp, ông lại là điệp viên H3 của Cụm tình báo chiến lược A20 (H67-J22), dưới quyền chỉ đạo của Thiếu tướng Nguyễn Văn Khiêm – tức Sáu Trí, người anh đã từng gợi mở con đường vào cách mạng cho ông.",
  "",
  "Trụ sở Hạ Nghị Viện khởi đầu là 1 nhà hát đầu tiên của miền Nam, sau năm 1955 bị chuyển thành trụ sở Quốc Hội, từ năm 1967 chuyển thành trụ sở Hạ Nghị Viện. Đến sau năm 1976, toà nhà này mới được trả lại đúng công năng là một nhà hát",
  "Ít ai biết rằng, Nguyễn Văn Lễ từng là một trong những sĩ quan cao cấp của ngành cảnh sát Sài Gòn. Năm 1951, ông khởi đầu tại Ty Đặc cảnh miền Đông, được anh rể họ Trần Bá Thành – người sau này là điệp viên H1 dìu dắt",
  "Đến năm 1963, ông giữ chức Chánh Văn phòng đặc biệt kiêm Bí thư Tổng Giám đốc Tổng nha Cảnh sát – vị trí gần như nắm giữ toàn bộ hoạt động nội bộ ngành an ninh thời bấy giờ. Chính trong cái “trung tâm thần kinh” đó, H3 đã lặng lẽ truyền từng mảnh tin ra hậu cứ, làm rối loạn không ít kế hoạch bình định và triệt phá phong trào của địch.",
  "Cũng năm ấy, sau một đêm trò chuyện dưới ánh đèn vàng mờ của một căn phòng ở Chợ Lớn với người anh họ Sáu Trí, ông Ba Lễ chấp nhận bước vào hàng ngũ A20 (Cụm H67 – J22) với mật danh H3. Quyết định ấy, là không đường lui.",
  "30 năm nằm vùng. 30 năm sống trong thế giới của sự hoài nghi và phản trắc. Nhưng H3 chưa bao giờ để lộ thân phận. Trái lại, ông được bầu với số phiếu cao vào Hạ viện, trở thành cây cầu bí mật giữa lòng kẻ thù và cuộc chiến giải phóng.",
  "",
  "Chứng minh thư của Điệp viên H3 – Nguyễn Văn Lễ. Thuộc bộ sưu tập L’s Private Collection của nhà sưu tầm Nguyễn Chu Đại Lâm",
  "Chuyến xe màu máu: Ván bài tại Tân Sơn Nhất",
  "",
  "Một buổi sáng tháng Chạp năm 1967, khi chiến dịch Mậu Thân đang được chuẩn bị trong bóng tối, H3 nhận chỉ thị từ cấp trên: đưa Tư lệnh Sư đoàn 9 – ông Nguyễn Thế Truyện (Năm Truyện) – vào thị sát các mục tiêu trọng yếu tại Sài Gòn, khu vực Bộ Tổng Tham mưu và sân bay Tân Sơn Nhất.",
  "Thay vì sử dụng xe công vụ quen thuộc, H3 mượn chiếc xe màu đỏ máu của Sáu Hoa – Thiếu tá tình báo Việt Nam Cộng hòa, một tay sát cộng khét tiếng. Sáu Hoa từng vỗ ngực tự đắc: “Xe tao là màu máu cộng sản. Ở cái đất Sài Gòn này, chẳng ai giết cộng giỏi như tao.” Nào ngờ chính chiếc xe “khét tiếng” đó lại là tấm bình phong đưa các sĩ quan Việt cộng đi điều nghiên chiến trường.",
  "Sau khi thị sát khu vực phía Bắc Sài Gòn, Bộ Tổng Tham mưu và vành đai Tân Sơn Nhất, ông Năm Truyện đề nghị vào tận sân bay để khảo sát. Tình cờ, cùng thời gian này, một thượng nghị sĩ Đài Loan – bạn của H3 – đến Sài Gòn. Nhân cơ hội, H3 liên lạc với chỉ huy phó phi trường Tân Sơn Nhất đề nghị hỗ trợ nghi thức nghênh tiếp. Lịch bay buổi chiều nhưng H3 cố ý đến vào buổi sáng, lấy cớ nhầm giờ bay để Năm Truyện và Bảy Vĩnh có nhiều thời gian quan sát mục tiêu. Chuyến thị sát đã thành công ngoài mong đợi.",
  "Phước Long!",
  "",
  "Mùa khô năm 1967. Trời Phước Long xanh rách như tấm vải lính, bị phơi quá nhiều lần giữa chảo lửa miền Đông. Từ phi trường Tân Sơn Nhứt, một chiếc máy bay L-19 Bird Dog chầm chậm lăn bánh ra đường băng. Bên trong, phi công người Mỹ tóc vàng, ngậm điếu xì-gà cháy dở, mắt đảo liên tục như loài chim săn mồi. Ngồi ghế sau, Ông là Nguyễn Văn Lễ vận comple đen, mái tóc được chải kỹ lưỡng, lặng lẽ quan sát bản đồ khu vực đặt trên đùi.",
  "Chiếc máy bay cất cánh, lượn vòng trên bầu trời Phước Long. Từ trên cao, H3 nhìn thấy trục đường tiếp vận chạy dọc quốc lộ 14, những trại lính dã chiến, điểm đặt pháo, lô cốt bê tông, và cả vị trí các kho đạn được nguy trang dưới tán cao su già.",
  "– “Quẹo trái một chút”, ông nhắc khẽ bằng tiếng Anh, giọng nhỏ nhẹ mà kiên quyết. Phi công Mỹ nhíu mày nhưng nghe theo. Không ai ngờ, người đàn ông lịch lãm phía sau đang âm thầm vẽ lại toàn bộ sơ đồ bố trí binh lực của tiểu khu Phước Long trong trí nhớ – như một kiến trúc sư vẽ nhà.",
  "Khi hạ cánh, một chiếc xe Jeep có gắn cờ ba sọc và biển số đặc biệt của tỉnh trưởng đã chờ sẵn. Một sĩ quan ngụy cung kính mở cửa:",
  "– “Thưa Nghị sĩ, xe chuẩn bị sẵn cho ngài đi thị sát các trại thương binh.”",
  "H3 gật đầu, nụ cười nhàn nhạt lướt qua môi. Ông ngồi vào ghế, không vội, mở sổ tay, lật trang có ghi chú bằng mực xanh nhạt: “Kho 31, căn cứ Vĩnh Hưng, trại 45 gần chùa cũ, điểm súng cối sau bãi mía…”",
  "Trong vòng hai giờ tiếp theo, ông đi khắp nơi: từ trụ sở phòng thủ, trại binh, đồn lính biệt kích, đến kho hậu cần. Không ai nghi ngờ gì. Ông là “người của chính quyền”, nghị sĩ “có tâm với thương binh và gia đình tử sĩ”. Ông còn khéo léo trao đổi vài lời ân cần với chỉ huy tiểu khu, hỏi han sĩ quan địa phương với giọng thông cảm:",
  "– “Phòng thủ khu vực rừng giáp biên phía Bắc ổn không, trung úy? Tôi nghe nói Việt cộng hay đột nhập từ đó…”",
  "Câu hỏi tưởng vu vơ ấy chính là cái bẫy khôn ngoan – để lấy lời xác nhận từ chính sĩ quan địch về hướng yếu phòng thủ, đường mòn dân sinh không kiểm soát, và tầm hoạt động pháo binh.",
  "Tối hôm đó, khi về tới Sài Gòn. H3 bước vào phòng làm việc, ông lật tấm bản đồ quân sự Phước Long, lấy bút chì ra và bắt đầu đánh dấu:",
  "• Ký hiệu hình tam giác: chốt chỉ huy trung tâm.\n• Ký hiệu hình chữ L: tuyến pháo phòng thủ.\n• Chấm đen: kho đạn, xăng dầu.\n• Mũi tên đỏ: tuyến hành quân thuận lợi của ta.",
  "Sáng hôm sau, bản đồ được gấp cẩn thận, giấu trong lớp bìa một tập tài liệu. Người trợ lý riêng – ông Bảy Vĩnh – mang tập tài liệu ấy sang một văn phòng luật bên đường Lê Thánh Tôn, nơi có một máy chụp hình mini kiểu Đức được giấu dưới gầm bàn.",
  "Một bản đồ chiến lược hoàn chỉnh của tiểu khu Phước Long – do chính Mỹ vẽ và điều chỉnh lại bằng mắt của một điệp viên Cộng sản – đã rời khỏi trung tâm quyền lực địch trong sự thản nhiên tuyệt đối.",
];

function FileDetailPage({
  detail,
  file,
  onClose,
}: {
  detail: DossierDetail | undefined;
  file: ParsedCard;
  onClose: () => void;
}) {
  const fallbackMetaRows = [
    ["MÃ HỒ SƠ", file.code],
    ["NGÀY GIẢI MẬT", file.date],
    ["ĐỘ MẬT", file.status],
    ["DUNG LƯỢNG", file.pages],
  ];
  const title = detail?.title ?? file.title;
  const headLines = detail?.head.split("\n") ?? [
    "2212 VIET NAM â€” BAN TÆ¯ LIá»†U & LÆ¯U TRá»®",
    "Báº¢N SAO Sá» 03 â€” LÆ¯U HÃ€NH THEO QUY CHáº¾ 2212VN/GM",
  ];
  const metaRows =
    detail?.meta.map(({ label, value }) => [label, value]) ?? fallbackMetaRows;
  /*
    label,
    value,
    red: label === "Äá»˜ Máº¬T",
  }));
  */
  const hero = detail?.hero;
  const content = detail?.paragraphs.length
    ? detail.paragraphs
    : file.slug === "h-ky-1-h3-h67-bong-ma-thanh-sai-gon"
      ? h3DossierParagraphs
      : file.body.length > 0
        ? file.body
        : [file.description];
  const imageSrc = hero?.localSrc ?? file.image;
  const imageAlt = hero?.alt ?? file.alt;
  const imageWidth = hero?.width ?? 900;
  const imageHeight = hero?.height ?? 506;

  useLayoutEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    resetDetailScroll();

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [file.slug]);

  const foot =
    detail?.foot ??
    "Há»’ SÆ  ÄÆ¯á»¢C BAN TÆ¯ LIá»†U 2212 VIET NAM BIÃŠN SOáº N. Dá»°A TRÃŠN CÃC NHÃ‚N Váº¬T Lá»ŠCH Sá»¬ CÃ“ THáº¬T";

  return (
    <div className="file-detail" role="dialog" aria-modal="true" aria-labelledby="file-detail-title">
      <button className="file-detail__backdrop" type="button" aria-label="Đóng hồ sơ" onClick={onClose} />
      <main
        className="dossier-page dossier-page--modal"
        onClick={(event) => {
          const target = event.target as HTMLElement;

          if (!target.closest(".dossier") && !target.closest(".dossier-topbar")) {
            onClose();
          }
        }}
      >
        <div className="dossier-topbar">
          <a className="dossier-back" href="#files" onClick={onClose}>
            ◂ QUAY LẠI KHO HỒ SƠ
          </a>
          <span>2212VN SECURE ARCHIVE // ĐÃ GIẢI MẬT</span>
        </div>
        <article className="dossier">
          <span className="dossier__punch dossier__punch--top" />
          <span className="dossier__punch dossier__punch--bottom" />
          <div className="dossier__head" data-head={headLines.join("\n")}>
            2212 VIET NAM — BAN TƯ LIỆU &amp; LƯU TRỮ
            <br />
            BẢN SAO SỐ 03 — LƯU HÀNH THEO QUY CHẾ 2212VN/GM
          </div>
          <div className="dossier__stampline">
            <span className="dossier__declassified">TỐI MẬT</span>
            <span className="dossier__stamp">ĐÃ GIẢI MẬT</span>
          </div>
          <h2 className="dossier__title" id="file-detail-title">{title}</h2>
          <div className="dossier__series">SERIES “{file.eyebrow}”</div>
          <div className="dossier__meta">
            {metaRows.map(([term, value]) => (
              <div key={term}>
                <span>{term}</span>
                <b className={term === "ĐỘ MẬT" ? "red" : undefined}>{value}</b>
              </div>
            ))}
          </div>
          {imageSrc ? (
            <Image
              className="dossier__hero"
              src={imageSrc}
              alt={imageAlt}
              width={imageWidth}
              height={imageHeight}
            />
          ) : null}
          <div className="dossier__content">
            <div className="payload-richtext max-w-none">
              {content.map((paragraph, index) => (
                <p key={`${file.slug}-${index}`}>{paragraph}</p>
              ))}
            </div>
          </div>
          <div className="dossier__foot" data-foot={foot}>
            HỒ SƠ ĐƯỢC BAN TƯ LIỆU 2212 VIET NAM BIÊN SOẠN. DỰA TRÊN CÁC NHÂN VẬT LỊCH SỬ CÓ THẬT
          </div>
        </article>
      </main>
    </div>
  );
}

function SimpleMediaCard({ item }: { item: ReturnType<typeof splitCardText> }) {
  return (
    <a className="doc-card" href={item.href || "#docs"}>
      <div className="doc-card__thumb">
        <Image src={item.image} alt={item.alt} width={900} height={506} />
      </div>
      <div className="doc-card__body">
        <span className="doc-card__ky">{item.status}</span>
        <b className="doc-card__title">{item.title}</b>
        <span className="doc-card__watch">{item.description || "XEM TRÊN YOUTUBE ↗"}</span>
      </div>
    </a>
  );
}

function ArchiveGrid({
  id,
  eyebrow,
  sheet,
  title,
  lede,
  items,
  alt,
  wide,
  compact,
}: {
  id: string;
  eyebrow: string;
  sheet: string;
  title: string;
  lede: string;
  items: ReturnType<typeof splitCardText>[];
  alt?: boolean;
  wide?: boolean;
  compact?: boolean;
}) {
  return (
    <section className={`sa-section${alt ? " sa-section--alt" : ""}`} id={id}>
      <div className="sa-section__inner">
        <SectionHead eyebrow={eyebrow} sheet={sheet} title={title} lede={lede} />
        <div className={wide ? "sponsors__grid" : compact ? "grid-auto grid-auto--narrow" : "grid-auto"}>
          {items.map((item, index) => (
            <GeneralCard
              item={item}
              compact={compact}
              key={`${item.href || item.image || item.title || "card"}-${index}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function GeneralCard({
  item,
  compact,
}: {
  item: ReturnType<typeof splitCardText>;
  compact?: boolean;
}) {
  return (
    <a className={compact ? "cmd-fig" : "card"} href={item.href || "#top"}>
      {item.image ? (
        <div className={compact ? "cmd-fig__image" : "card__thumb card__thumb--190"}>
          <Image src={item.image} alt={item.alt} width={900} height={compact ? 657 : 506} />
        </div>
      ) : null}
      <div className="card__body">
        <div className="card__no">{item.status}</div>
        <h3 className="card__title">{item.title}</h3>
        <p className="card__desc">{item.description}</p>
      </div>
    </a>
  );
}

function Footer() {
  return (
    <footer className="arc-footer" id="footer">
      <div className="arc-footer__inner">
        <div className="arc-footer__eot">
          {"// KẾT THÚC PHIÊN TRUY CẬP — END OF TRANSMISSION //"}
        </div>
        <div className="arc-footer__cols">
          <div className="arc-footer__brand">
            <Image src="/images/2212/archive/01-2212VN-LG-3-removebg-preview.png" alt="2212" width={64} height={64} />
            <div>
              <b>2212 VIET NAM</b>
              <span>GUARDIANSHIP · DETERMINATION · DARING · INTELLIGENCE</span>
            </div>
          </div>
          <div className="arc-footer__contact">
            <span>TRẠM:</span> HÀ NỘI, VIỆT NAM<br />
            <span>ĐƯỜNG DÂY:</span> (+84) 777 · 121 · 007<br />
            <span>HÒM THƯ:</span> CONTACT@2212.VN
          </div>
          <div className="arc-footer__social">
            <a href="#civic">THIỆN NGUYỆN APP ↗</a>
            <a href="#top">FACEBOOK ↗</a>
            <a href="#docs">YOUTUBE ↗</a>
            <a href="#top">TIKTOK ↗</a>
            <a href="#top">ZALO ↗</a>
          </div>
        </div>
        <div className="arc-footer__legal">
          <span>© 2026 2212 VIET NAM — BẢN QUYỀN THUỘC BAN ĐIỀU HÀNH</span>
          <span>MÃ HÓA ĐẦU-CUỐI · MỌI PHIÊN ĐỀU ĐƯỢC GHI LẠI</span>
        </div>
      </div>
    </footer>
  );
}

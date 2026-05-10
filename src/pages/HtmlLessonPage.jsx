export default function HtmlLessonPage({ html, title }) {
  return (
    <iframe
      className="lesson-frame"
      title={title}
      srcDoc={html}
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
    />
  );
}

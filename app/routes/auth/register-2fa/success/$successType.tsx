import { Link, useParams } from "remix";

export default function SuccessDialog() {
  const { successType } = useParams();
  let content;

  if (successType === "delete") {
    content = "2FA has been removed! 🔓";
  } else if (successType === "added") {
    content = "2FA has been added! 🔐";
  }

  return (
    <dialog open>
      <article>
        <Link replace to="../" className="close"></Link>
        <br />
        <h1>{content}</h1>
        <footer>
          <Link replace to="../" role="button">
            Close
          </Link>
        </footer>
      </article>
    </dialog>
  );
}

import { ImageResponse } from "next/og";

export const alt =
  "Lovable Original Web Development Foundations: learn semantic HTML, build and save a page, and check your recall.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const loraSemiBold = fetch(
  "https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787zAvCJG.ttf",
).then((response) => {
  if (!response.ok) {
    throw new Error("Could not load the social preview display font.");
  }

  return response.arrayBuffer();
});

const loopSteps = [
  ["01", "Understand"],
  ["02", "Recall"],
  ["03", "Build"],
];

export default async function OpenGraphImage() {
  const displayFont = await loraSemiBold;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
          padding: "54px 58px 48px",
          color: "#17231e",
          backgroundColor: "#f6f7f2",
          backgroundImage:
            "linear-gradient(rgba(23,35,30,0.038) 1px, transparent 1px), linear-gradient(90deg, rgba(23,35,30,0.038) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-164px",
            right: "-86px",
            width: "470px",
            height: "470px",
            borderRadius: "50%",
            backgroundColor: "#dfeadf",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "14px 14px 14px 5px",
                color: "#f6f7f2",
                backgroundColor: "#17231e",
                fontFamily: "Lora",
                fontSize: "29px",
                fontWeight: 600,
              }}
            >
              L
            </div>
            <div
              style={{
                fontSize: "25px",
                fontWeight: 700,
                letterSpacing: "-0.5px",
              }}
            >
              Lovable Original
            </div>
          </div>
          <div
            style={{
              paddingRight: "14px",
              color: "#456056",
              fontSize: "17px",
              fontWeight: 600,
            }}
          >
            One live course
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "62px",
          }}
        >
          <div
            style={{
              width: "690px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                marginBottom: "20px",
                color: "#175437",
                fontSize: "17px",
                fontWeight: 800,
                letterSpacing: "2.6px",
                textTransform: "uppercase",
              }}
            >
              Web Development Foundations
            </div>
            <div
              style={{
                fontFamily: "Lora",
                fontSize: "64px",
                fontWeight: 600,
                letterSpacing: "-3px",
                lineHeight: 0.98,
              }}
            >
              Build a page the browser understands.
            </div>
          </div>

          <div
            style={{
              width: "330px",
              display: "flex",
              flexDirection: "column",
              padding: "26px 28px",
              border: "1px solid #cbd6cd",
              borderRadius: "22px",
              backgroundColor: "rgba(255,255,255,0.88)",
              boxShadow: "0 18px 50px rgba(23,35,30,0.10)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "14px",
                color: "#5e6b65",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "1.1px",
                textTransform: "uppercase",
              }}
            >
              <span>Learning loop</span>
              <span>01—03</span>
            </div>
            {loopSteps.map(([number, label], index) => (
              <div
                key={number}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  minHeight: "61px",
                  borderTop:
                    index === 0 ? "1px solid #dce2dc" : "none",
                  borderBottom: "1px solid #dce2dc",
                }}
              >
                <span
                  style={{
                    width: "30px",
                    color: "#287652",
                    fontSize: "14px",
                    fontWeight: 800,
                  }}
                >
                  {number}
                </span>
                <span
                  style={{
                    fontFamily: "Lora",
                    fontSize: "24px",
                    fontWeight: 600,
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              width: "126px",
              height: "5px",
              borderRadius: "999px",
              backgroundColor: "#287652",
            }}
          />
          <div
            style={{
              color: "#5e6b65",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            lovable-original-eight.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Lora",
          data: displayFont,
          style: "normal",
          weight: 600,
        },
      ],
    },
  );
}

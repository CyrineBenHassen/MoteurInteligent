<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your NexTest Password</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,300&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #060e1e;
      font-family: 'DM Sans', Arial, sans-serif;
      color: #fff;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 48px 16px; }

    /* ══ LOGO ══ */
    .header {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 14px;
      margin-bottom: 40px;
    }

    .gem {
      width: 52px;
      height: 52px;
      min-width: 52px;
      border-radius: 14px;
      background: linear-gradient(135deg, #8a6a00 0%, #C9A227 50%, #E8C84A 100%);
      box-shadow: 0 0 32px rgba(201,162,39,0.4), 0 8px 24px rgba(201,162,39,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .brand-name {
      font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
      font-size: 26px;
      font-weight: 700;
      color: #ffffff !important;
      letter-spacing: 3px;
      text-transform: uppercase;
      line-height: 1;
      display: block;
    }

    .brand-sub {
      font-family: 'DM Sans', Arial, sans-serif;
      font-size: 8px;
      font-weight: 500;
      color: #C9A227 !important;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-top: 5px;
      opacity: 0.85;
      display: block;
    }

    /* ══ CARD ══ */
    .card {
      background: #0b1829;
      border: 1px solid rgba(201,162,39,0.18);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 32px 80px rgba(0,0,0,0.5);
    }

    .card-bar {
      height: 3px;
      background: linear-gradient(90deg, transparent, #C9A227, #E8C84A, #C9A227, transparent);
    }

    .card-body { padding: 52px 48px 44px; }

    /* ══ LOCK ICON ══ */
    .lock-wrap {
      width: 76px;
      height: 76px;
      border-radius: 20px;
      background: rgba(201,162,39,0.1);
      border: 1px solid rgba(201,162,39,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 36px;
    }

    .eyebrow {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 3.5px;
      text-transform: uppercase;
      color: #C9A227;
      text-align: center;
      margin-bottom: 14px;
    }

    h1 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 38px;
      font-weight: 600;
      color: #fff;
      text-align: center;
      line-height: 1.15;
      margin-bottom: 18px;
    }
    h1 em { color: #C9A227; font-style: italic; font-weight: 300; }

    .divider {
      width: 48px; height: 2px;
      background: linear-gradient(90deg, transparent, rgba(201,162,39,0.55), transparent);
      margin: 0 auto 30px; border-radius: 2px;
    }

    .body-text {
      font-size: 15px;
      color: rgba(255,255,255,0.55);
      line-height: 1.95;
      font-weight: 300;
      text-align: center;
      max-width: 420px;
      margin: 0 auto 36px;
    }
    .body-text strong { color: rgba(255,255,255,0.85); font-weight: 600; }

    /* ══ BUTTON ══ */
    .btn-wrap { text-align: center; margin-bottom: 36px; }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #C9A227, #E8C84A);
      color: #060e1e !important;
      text-decoration: none;
      font-family: 'DM Sans', Arial, sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      padding: 17px 44px;
      border-radius: 10px;
      box-shadow: 0 6px 28px rgba(201,162,39,0.45);
    }

    /* ══ NOTICE ══ */
    .notice {
      background: rgba(201,162,39,0.05);
      border: 1px solid rgba(201,162,39,0.14);
      border-radius: 12px;
      padding: 18px 22px;
      text-align: center;
      margin-bottom: 28px;
    }
    .notice p { font-size: 13px; color: rgba(255,255,255,0.38); margin: 0; line-height: 1.7; }
    .notice strong { color: #C9A227; font-weight: 600; }

    /* ══ FALLBACK ══ */
    .fallback { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px; }
    .fallback p { font-size: 12px; color: rgba(255,255,255,0.22); margin-bottom: 10px; text-align: center; }
    .fallback a { display: block; font-size: 11px; color: rgba(201,162,39,0.5); word-break: break-all; text-decoration: none; text-align: center; }

    /* ══ FOOTER ══ */
    .footer { text-align: center; margin-top: 32px; }
    .footer p { font-size: 11.5px; color: rgba(255,255,255,0.16); line-height: 1.9; }
    .footer a { color: rgba(201,162,39,0.38); text-decoration: none; }
  </style>
</head>
<body>
<div class="wrapper">

  <!-- ══ LOGO ══ -->
  

  <!-- ══ CARD ══ -->
  <div class="card">
    <div class="card-bar"></div>
    <div class="card-body">

    

      <p class="eyebrow">Security Notice</p>
      <h1>Reset your <em>Password</em></h1>
      <div class="divider"></div>

      <p class="body-text">
        Hello <strong>{{ $user->name ?? 'there' }}</strong>,<br/>
        We received a request to reset the password linked to your
        NexTest account. Click the button below to choose a new password.
      </p>

      <div class="btn-wrap">
        <a href="{{ $url }}" class="btn">Reset Password</a>
      </div>

      <div class="notice">
        <p>
          This link will expire in <strong>{{ $count }} minutes</strong>.<br/>
          If you did not request a password reset, no further action is required.
        </p>
      </div>

      <div class="fallback">
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <a href="{{ $url }}">{{ $url }}</a>
      </div>

    </div>
  </div>

  <!-- ══ FOOTER ══ -->
  <div class="footer">
    <p>
      &copy; {{ date('Y') }} NexTest &middot; Test Automation Platform<br/>
      You're receiving this because a password reset was requested for your account.<br/>
    
    </p>
  </div>

</div>
</body>
</html>
# Verdict R9/R11 — #BuildHybridAI 2026 (Devpost, Google/Firebase)
Tanggal cek: 23 Nov 2026 ~09:35 WIB. Dokumen dibaca langsung (bukan ringkasan):
- Official Rules: https://firebasehybridaihackathon.devpost.com/rules (504 baris, dibaca utuh L0–L504)
- Devpost Terms of Service (diinkorporasi Rules §22): https://info.devpost.com/terms (630 baris; dicek via find)

## Hasil pencarian kata kunci (browser.find, hitungan kemunculan)
| Istilah | Rules | Devpost ToS |
|---|---|---|
| KYC | 0 | 0 |
| AML | 0 | 0 |
| passport | 0 | 0 |
| identification | 0 | 0 |
| selfie | 0 | 0 |
| government | 2 — hanya (a) larangan pegawai government agency ikut (§3) dan (b) kepatuhan pajak/valas (§10) | — |

## Kutipan persis — verifikasi pemenang (yang ADA)
Rules §8 — "Winner Verification Requirement":
> "THE AWARD OF A PRIZE TO A POTENTIAL WINNER IS SUBJECT TO VERIFICATION OF THE IDENTITY, QUALIFICATIONS AND ROLE OF THE POTENTIAL WINNER IN THE CREATION OF THE SUBMISSION."
> "each potential winner may be required to sign and return a Declaration of Eligibility and Liability and Publicity Release and provide any additional information that may be required by Sponsor."
> "potential winners must return all such required documents within ten (10) business days following attempted notification or such potential winner will be deemed to have forfeited the prize"

Rules §13 — Privacy:
> "Google will use this information in accordance with its Privacy Policy ..., including for administering the contest and verifying Participant's identity, postal address and telephone number in the event an entry qualifies for a prize."

Devpost ToS §5 — verifikasi karya/peran, bukan dokumen identitas:
> "The Poster has the right to require additional information. They also have the right to access any software application that is part of your Submission, in person or via any other reasonable manner, to verify that the software application functions and operates as described in other parts of your Submission, or to verify your role in creating the software."

## Kutipan persis — pajak / payout (R11 FLAG, bukan SKIP)
Rules §10 — Fees & Taxes:
> "Payments to potential winners are subject to the express requirement that they submit to Administrator all documentation requested (including IRS Form W-9 for US residents or Form W-8BEN for non-US residents, as applicable) to comply with tax reporting and withholding obligations. Prizes will be net of any taxes required by law to be withheld. Failure to timely provide requested tax documentation may result in prize forfeiture and selection of an alternate winner."

Rules §9 — payout: hadiah hanya dikirim "only after receipt of the completed winner affidavit and other required forms"; "Prizes will be delivered within sixty (60) days of the Sponsor or Devpost's receipt of the completed Required Forms."

## Kutipan persis — eligibility & entry gratis
Rules §3 — Indonesia TIDAK ada di daftar excluded:
> "not be a resident of, and/or organizations domiciled in Brazil, Quebec, Crimea, Russia, Italy, Syria, Sudan, Belarus, Cuba, Iran, and North Korea"
Rules §5: "NO PURCHASE NECESSARY TO ENTER OR WIN. ... If you do not have a Devpost account already, you can sign up for a Devpost account at no cost"
Periode: 11 Nov 2026 13:30 PT – 30 Nov 2026 14:00 PT (= 1 Des 2026 05:00 WIB). Pemenang diumumkan ~21 Des 2026.

## Verdict: GO (lanjut build) — BUKAN SKIP
Alasan, dengan standar yang sama seperti G2:
- G2 SKIP karena T&C-nya eksplisit menyimpan hak KYC/AML di payout (R9: "ToS-nya menyimpan hak itu").
- Di sini TIDAK ADA kewajiban KYC maupun reservasi hak KYC/AML di kedua dokumen: nol kemunculan KYC/AML/paspor/selfie/identification; tidak ada satu kalimat pun yang menyebut dokumen identitas pemerintah.
- Yang ada: verifikasi identitas dalam arti (a) affidavit + Declaration of Eligibility, (b) verifikasi nama/alamat/telepon, (c) verifikasi karya & peran pembuat — bukan KYC.
- Klausul "provide any additional information that may be required by Sponsor" bersifat terbuka/generik (boilerplate Devpost umum), bukan reservasi KYC. Dicatat sebagai FLAG, bukan pemicu R9.
- W-8BEN = R11 FLAG: hanya IDR yang boleh urus bila menang; lane TIDAK PERNAH isi/kirim form pajak.

## Caveat / FLAG untuk IDR
- Bila saat menang nanti Google/Devpost meminta KTP/paspor/selfie, keputusan ada di IDR (R9: hanya IDR yang bisa membuka; lane tidak pernah isi/kirim dokumen identitas). Risiko ini tidak tertulis di Rules hari ini, jadi tidak bisa dijadikan alasan SKIP hari ini — tapi bila permintaan itu muncul, lane STOP di titik itu dan eskalasi ke IDR.
- Entry gratis, tanpa KYC di titik masuk — memenuhi syarat STOP di brief awal (STOP hanya bila "berbayar / wajib KYC di titik masuk").

## Status lane
Build DIHENTIKAN sementara pada 23 Nov 2026 ~09:35 WIB menunggu konfirmasi koordinator atas verdict ini. Langkah 0 (baca Rules) + Langkah 1 (riset Firebase AI Logic JS SDK v12.5.0+, InferenceMode, inferenceSource) selesai; kode belum ditulis.

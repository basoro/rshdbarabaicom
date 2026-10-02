import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import RichHtml from '@/components/RichHtml';
import type { SiteBootstrap } from '@/types';

type SiteFooterProps = {
  bootstrap: SiteBootstrap;
};

export default function SiteFooter({ bootstrap }: SiteFooterProps) {
  const quickLinks = bootstrap.quickLinks;
  const footerHtml = (bootstrap.settings.footer || 'Hak cipta © ICT RSHD Barabai.')
    .replace(/\{\?=date\("Y"\)\?\}/g, String(new Date().getFullYear()))
    .replace(/&copy;/g, '&copy;');

  return (
    <footer className="bg-[#0d3f37] text-emerald-50">
      <div className="border-b border-white/10 bg-[#135e4f]">
        <div className="container grid gap-4 py-5 text-sm md:grid-cols-3">
          <div>
            <p className="font-semibold text-white">Alamat</p>
            <p className="mt-1 text-emerald-100/80">{bootstrap.contacts.address}</p>
          </div>
          <div>
            <p className="font-semibold text-white">Kontak Cepat</p>
            <p className="mt-1 text-emerald-100/80">{bootstrap.contacts.phone} • {bootstrap.contacts.complaintPhone}</p>
          </div>
          <div>
            <p className="font-semibold text-white">Email</p>
            <p className="mt-1 text-emerald-100/80">{bootstrap.contacts.email}</p>
          </div>
        </div>
      </div>
      <div className="container grid gap-10 py-14 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <h4 className="font-display text-[1.4rem] text-white font-semibold">{bootstrap.settings.nama_instansi || 'RSUD H. Damanhuri'}</h4>
          <div className="mt-6 space-y-3 text-sm text-emerald-100/80">
            <p className="flex items-start gap-3">
              <MapPin className="mt-1 h-4 w-4" />
              <span>{bootstrap.contacts.address}</span>
            </p>
            <p className="flex items-center gap-3">
              <Phone className="h-4 w-4" />
              <span>{bootstrap.contacts.complaintPhone}</span>
            </p>
            <p className="flex items-center gap-3">
              <Mail className="h-4 w-4" />
              <span>{bootstrap.contacts.email}</span>
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-display text-[1.4rem] font-semibold text-white">Layanan Utama</h4>
          <div className="mt-5 grid gap-3 text-sm text-emerald-100/80">
            {bootstrap.featuredServices.map((service) => (
              <Link key={service.slug} to={`/${service.slug}`} className="transition hover:text-white">
                {service.title}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display text-[1.4rem] font-semibold text-white">Tautan Penting</h4>
          <div className="mt-5 grid gap-3 text-sm text-emerald-100/80">
            {quickLinks.map((item) =>
              item.url ? (
                <a key={item.label} href={item.url} target="_blank" rel="noreferrer" className="transition hover:text-white">
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} to={`/${item.slug}`} className="transition hover:text-white">
                  {item.label}
                </Link>
              ),
            )}
          </div>
        </div>

        <div>
          <h4 className="font-display text-[1.4rem] font-semibold text-white">Media Sosial & Aplikasi</h4>
          <p className="mt-5 text-sm leading-7 text-emerald-100/80">
            Ikuti informasi rumah sakit, berita layanan, dan publikasi terkini melalui kanal resmi.
          </p>
          <a
            href="https://play.google.com/store/apps/details?id=com.rshdbarabai.apam"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
          >
            Download APAM
          </a>
          <div className="mt-6 flex items-center gap-3">
            <a href="https://www.facebook.com/rshdbarabai" target="_blank" rel="noreferrer" className="rounded-2xl border border-emerald-700 p-3 transition hover:bg-emerald-800">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="https://www.instagram.com/rshdbarabaiofficial/" target="_blank" rel="noreferrer" className="rounded-2xl border border-emerald-700 p-3 transition hover:bg-emerald-800">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://www.youtube.com/channel/UCO8EnQpWUH83wlCLoHRkdMA" target="_blank" rel="noreferrer" className="rounded-2xl border border-emerald-700 p-3 transition hover:bg-emerald-800">
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-emerald-900">
        <div className="container flex flex-col gap-3 py-5 text-[14px] text-emerald-200/70 md:flex-row md:items-center md:justify-between">
          <RichHtml
            html={footerHtml}
            className="prose prose-sm text-emerald-200/70 text-[14px] prose-p:my-0 prose-a:text-white prose-a:no-underline hover:prose-a:text-emerald-100"
          />
          <p>Powered by mLITE.id</p>
        </div>
      </div>
    </footer>
  );
}

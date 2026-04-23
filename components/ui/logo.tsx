import Image from 'next/image';

export function Logo(){
    <Image
    className="dark:invert"
    src="../public/trackflow-text-logo.svg"
    alt="TrakFlow logo"
    width={100}
    height={20}
    priority
  />
}
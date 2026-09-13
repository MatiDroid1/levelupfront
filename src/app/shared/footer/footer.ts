import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="border-t border-[#282a32]/60 bg-[#0c0e16]">
      <div class="max-w-[88rem] mx-auto px-4 md:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#988d9f]">
        <span class="font-['Space_Grotesk']">
          Pedidos360 · <span class="text-[#ddb7ff]">LevelUp Gamer</span> · DSY1107 Desarrollo Cloud Native
        </span>
        <span class="font-mono">Angular 20 · Spring Boot · Entra ID · AWS</span>
      </div>
    </footer>
  `,
})
export class Footer {}

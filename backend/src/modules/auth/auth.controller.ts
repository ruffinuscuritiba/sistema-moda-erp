import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { DemoAccessDto } from './dto/demo-access.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** Auto-login público pra conta demo — usada pela página /demo do frontend
   * (e pelo hub de demonstração do R_FoodSaaS). Sem senha: entra direto numa
   * conta já seedada, sem passar pela tela de login. `niche` (opcional) leva
   * pra uma demo temática dedicada (nome/cor/catálogo próprios do tipo de
   * loja — ver DEMO_NICHES); ausente ou desconhecido cai na conta genérica
   * "Loja Demo Moda". */
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('demo-access')
  demoAccess(@Body() dto: DemoAccessDto) {
    return this.authService.demoAccess(dto.niche);
  }
}
